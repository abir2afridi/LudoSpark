/**
 * ================================================================
 *  DICE BOARD THROW SYSTEM   —   dice-board-throw.js
 * ================================================================
 *
 *  এই file তৈরি হয়েছে dice handoff থেকে "Board Throw" mechanism-টা
 *  আলাদা রাখতে — দুইটা throwing mechanism এখন দুইটা আলাদা file-এ:
 *
 *  ⚠️ IMPORTANT SEPARATION OF LOGIC (ভবিষ্যতের AI-দের জন্য):
 *  ---------------------------------------------------------
 *  • BOARD THROW (হাত থেকে board-এর দিকে সরাসরি ছোড়া) — এই file-এ।
 *    এখানে real physics চলে (gravity, bounce, tumble, fair face settle)
 *    — সেটা `physics.js` এর `DicePhysics.roll()` engine primitive দেয়,
 *    trajectory + spawn ঠিক করা এখানে (dice-board-throw.js)।
 *
 *  • RETRIEVE / HANDOFF (board থেকে হাতে ফেরানো + পরের player-কে pass)
 *    — dice-handoff.js-এ আছে। সেখানে physics simulation হয় না;
 *    প্রতি frame-এ `physics.holdAt()` দিয়ে kinematic arc flight হয়।
 *
 *  কেন আলাদা? — দুইটার motion সম্পূর্ণ আলাদা:
 *    - Board throw = force + tumble + settle  (এই file + physics.roll)
 *    - Handoff     = controlled arc + catch   (dice-handoff.js)
 *  মিশালে এক জায়গার bug আরেক জায়গায় ঢুকে যায় — তাই আলাদা রাখা।
 *
 *  ---------------------------------------------------------------
 *  FLOW (game.js handleRoll থেকে কল হয়):
 *    ১) throwToBoard(playerId, rollValue, onComplete)
 *         → characters.startThrow() — windup + power-swing animation
 *    ২) forward-swing এর ৪৫% মাঝে onRelease fire → _launch()
 *         (characters.js-তে releaseAt = windup + release*0.45)
 *    ৩) _launch(): hand position নেওয়া → _safeSpawn() দিয়ে
 *         spawn point wall-এর ভিতরে বলে নিশ্চিত → physics.roll()
 *    ৪) physics ভেতরে উড়ে গিয়ে পড়ে, bounce করে, settle হয়ে
 *         target face দেয় → onComplete(rolledFace)
 *    ৫) game.onDiceRollComplete(rolledFace) বাকি কাজ নেয়
 *
 *  ---------------------------------------------------------------
 *  ⚠️ WALL BUG-এর ইতিহাস (কেন _safeSpawn() আছে):
 *    physics.js-তে চারপাশে অদৃশ্য containment wall আছে
 *    (z=±11.4 / x=±11.4, y 0..5, দৈর্ঘ্য half=11.4)। আগে release
 *    windup-এর শেষে হতো — ওই মুহূর্তে হাত পেছনে থাকে (z≈12.3,
 *    wall-এর বাইরে!) → dice ভেতরে ঢোকার আগেই অদৃশ্য wall-এ আঘাত
 *    খেত, বাইরে পড়ে থাকত, পরে settle-clamp করে মাঝখানে teleport
 *    হতো। দুইটা fix এখন আছে:
 *      (ক) characters.js — release এখন forward-swing এর মাঝে
 *          (হাত সামনে board-এর দিকে মুখ করা)
 *      (খ) _safeSpawn() — spawn সবসময় |x|,|z| ≤ 10.5 (wall-এর ভিতরে),
 *          y ≥ 1.5 (ফ্লোরে না ধসে পড়ে) বলে নিশ্চিত করে, hand position
 *          যাই হোক না কেন
 *
 *  ---------------------------------------------------------------
 *  GAME.JS-এর সাথে contract:
 *    • শুধু `throwToBoard()` কল হয়; game.state 'ROLLING' রাখে game.js
 *    • onComplete = game.onDiceRollComplete — এই file state machine
 *      টানে না, শুধু ছুড়ে দেয়
 *    • throw চলাকালীন game.diceHolder = -1 (শুরুতেই _launch সেট করে,
 *      তাই animate() হাতে dice টেনে নেয় না)
 *    • handoff চলাকালীন handleRoll ব্লক থাকে (dice-handoff contract)
 *  ---------------------------------------------------------------
 *  সাথে থাকা constants:
 *    • tossAngles — প্রতি player-র পাশ থেকে center-এর fallback toss
 *      (handPos না পেলে physics.roll fromAngle path ব্যবহার করে)
 *    • SAFE_EDGE/MIN_SPAWN_Y — containment wall সুরক্ষা
 */

class DiceBoardThrowSystem {
  constructor(game) {
    this.game = game;

    // Player চারজনের পাশ-angle (radian) — hand position না পেলে
    // physics.roll এই angle থেকে board center-এর দিকে toss করবে
    this.tossAngles = [
      3 * Math.PI / 4,   // Player 1: bottom-left
      -3 * Math.PI / 4,  // Player 2: top-left
      -Math.PI / 4,      // Player 3: top-right
      Math.PI / 4        // Player 4: bottom-right
    ];

    // Containment wall: physics.js wall দাঁড়িয়ে আছে ±11.4 (half-thickness
    // 0.2 → inner face ≈ 11.2), dice half-size ≈ 0.45 → spawn যদি
    // ±10.5-এর ভিতরে হয়, dice কখনো wall-এর সাথে overlap করবে না
    this.SAFE_EDGE = 10.5;
    // হাত খুব নিচে থাকলে dice ফ্লোরে ধসে যাবে — ন্যূনতম উচ্চতা
    this.MIN_SPAWN_Y = 1.5;
  }

  // =========================================================
  //  PUBLIC API
  // =========================================================

  /**
   * character দিয়ে board-এ dice ছোড়া — পুরো board-throw mechanism-এর
   * একমাত্র entry point।
   *
   * @param {number} playerId - কোন character ছুড়বে (0..3)
   * @param {number} rollValue - মানুষ/AI যে face টানেছে (1..6, fair)
   * @param {function} onComplete - physics settle শেষে ডাকা হবে
   *                                 onComplete(rolledFace)
   */
  throwToBoard(playerId, rollValue, onComplete) {
    const chars = this.game.characters;
    if (!chars) {
      // 3D character না থাকলে সরাসরি ফেলা (tests/fallback)
      this._launch(playerId, rollValue, onComplete);
      return;
    }
    // ১) প্রথমে animation: windup (0.32s) + power-swing শুরু হয়;
    //    swing এর ৪৫% মাঝে onRelease fire হবে (নিচে _launch)
    chars.startThrow(playerId, () => {
      this._launch(playerId, rollValue, onComplete);
    });
  }

  // =========================================================
  //  INTERNALS
  // =========================================================

  /** ক) animation-এর release moment — hand থেকে spawn ধরা + ছোড়া */
  _launch(playerId, rollValue, onComplete) {
    const g = this.game;

    // এই মুহূর্তের hand world position (swing সামনে এগিয়ে থাকে)
    let handPos = null;
    if (g.characters) {
      const hand = g.characters.getHandWorldPosition(playerId, g._tmpVec);
      if (hand) handPos = hand.clone();
    }

    // খ) spawn কখনোও containment wall-এর সাথে overlap করবে না
    const spawn = this._safeSpawn(handPos);

    // dice হাতে ধরা অবস্থায় থাকবে না — এখন থেকে physics চালাবে
    // (animate() এর holdAt guard: diceHolder === -1 হলে হাতে টেনে নেয় না)
    g.diceHolder = -1;

    // গ) real physics flight — gravity, bounce, spin, target face settle
    //    (physics.js DicePhysics.roll — engine primitive, এখানে থেকে নয়)
    g.physics.roll(rollValue, onComplete, this.tossAngles[playerId], spawn);
  }

  /**
   * হাতের position থেকে নিরাপদ spawn point — wall-এর ভিতরে বলে নিশ্চিত।
   * hand position কোথাই থাকুক (swing phase যাই হোক), dice সবসময়
   * ভেতর থেকে ছোড়া হবে → অদৃশ্য wall-এ আঘাতের আশঙ্কা নেই।
   */
  _safeSpawn(handPos) {
    if (!handPos) return null; // fallback: physics.roll fromAngle toss path
    const e = this.SAFE_EDGE;
    return {
      x: Math.max(-e, Math.min(e, handPos.x)),
      y: Math.max(this.MIN_SPAWN_Y, handPos.y),
      z: Math.max(-e, Math.min(e, handPos.z))
    };
  }
}

window.DiceBoardThrowSystem = DiceBoardThrowSystem;
