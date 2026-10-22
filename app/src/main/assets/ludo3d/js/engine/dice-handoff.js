/**
 * ================================================================
 *  DICE HANDOFF & RETRIEVAL SYSTEM   —   dice-handoff.js
 * ================================================================
 *
 *  এই file তৈরি হয়েছে "Dice কীভাবে এক জায়গা থেকে আরেক জায়গায় যায়"
 *  (board ↔ character hand transfer) — সেই লজিক আলাদা রাখতে।
 *
 *  ⚠️ IMPORTANT SEPARATION OF LOGIC (ভবিষ্যতের AI-দের জন্য):
 *  ---------------------------------------------------------
 *  • BOARD THROW (হাত থেকে board-এর দিকে দিয়ে দেওয়া) — physics.js-এর
 *    `DicePhysics.roll(targetValue, cb, fromAngle, fromPos)` এ আছে।
 *    সেখানে real physics (gravity, bounce, spin, target face settle) চলে।
 *
 *  • RETRIEVE / HANDOFF (board থেকে হাতে ফেরানো এবং পরের খেলোয়াড়কে
 *    দেওয়া) — এই file-এ আছে। এখানে physics simulation হয় না; বরং প্রতি
 *    frame-এ `physics.holdAt(x, y, z)` দিয়ে dice body-কে kinematic রেখে
 *    একটা smooth arc (বাঁক) ধরে উড়ে যায়। holdAt করলে physics gravity তাকে
 *    নিচে ফেলে না, mesh শুধু body-র সাথে sync হয়।
 *
 *  কেন আলাদা? — কারণ দুইটার logic সম্পূর্ণ আলাদা:
 *    - Board throw = force + tumble + fair face settle (DicePhysics)
 *    - Handoff    = controlled arc flight + catch animation (এই file)
 *  মিশালে একটা জায়গার bug আরেকটায় ঢুকে যায়, তাই আলাদা।
 *
 *  ---------------------------------------------------------------
 *  দুইটা flow আছে (দুটোই game.js থেকে কল হয়):
 *
 *  FLOW A — RETRIEVE (bonus roll / double move পেলে):
 *    যখন একই খেলোয়াড় আবার পাছে (৬ পেলে বা capture করলে), তখন
 *    board-এ পড়ে থাকা dice ওটার হাতে উড়ে ফিরে আসে, তারপর সে আবার
 *    board-এ throw করে (throw physics.js-এ)।
 *      API: retrieveToPlayer(playerId, onDone)
 *
 *  FLOW B — HANDOFF (turn শেষ হয়ে next player-এ যাওয়া):
 *    ১) board থেকে আগের player-এর হাতে dice ফেরে (retrieve)
 *    ২) আগের player gentle pass throw করে → dice উড়ে next player-এর
 *       হাতে যায় (arc ধরে, ঝরঝরে trail সহ)
 *    ৩) next player catch animation করে (হাত বাড়িয়ে ধরে), তারপর
 *       hold-pose-এ চলে যায় — এরপর সে নিজের turn-এ board-এ throw করবে
 *      API: passToNextPlayer(fromPlayerId, toPlayerId, onDone)
 *
 *  ---------------------------------------------------------------
 *  GAME.JS-এর সাথে contract (যা মানতে হবে):
 *    • handoff চলাকালীন game.diceHolder = -1 রাখতে হবে
 *      (animate() loop যেন হাতে না টেনে আনে) — animate() এ
 *      `!this.diceHandoff.isBusy()` guard আছে।
 *    • handoff চলাকালীন handleRoll() human tap গ্রহণ করে না;
 *      AI/auto-timer `handleRoll(true)` retry পাঠায় যতক্ষণ না শেষ হয়।
 *    • onDone callback-এ দায়িত্ব: diceHolder ঠিক করা + scheduleAITurn।
 *    • stopRunning()/newGame()/newSnakeLadderGame() থেকে cancel()
 *      কল হয় — মাঝপথে game বন্ধ হলে dice আটকে যাবে না।
 */

class DiceHandoffSystem {
  constructor(game) {
    this.game = game;
    // Phase machine: 'IDLE' = কিছু চলছে না, 'FLYING' = board↔hand উড়ানো,
    // 'PASSING' = এক হাত থেকে আরেক হাতে pass চলছে
    this.phase = 'IDLE';
    this.flight = null;
  }

  isBusy() {
    return this.phase !== 'IDLE';
  }

  /** মাঝপথে বাতিল — নতুন game শুরু বা abort হলে call হয় */
  cancel() {
    this.phase = 'IDLE';
    this.flight = null;
  }

  // =========================================================
  //  PUBLIC API
  // =========================================================

  /**
   * FLOW A — RETRIEVE (bonus roll / double-move এর জন্য)
   * board-এ পড়ে থাকা dice উক্ত খেলোয়াড়ের হাতে উড়ে ফিরে আসে।
   * শেষ হলে onDone() কল হয় — game.js সেখানে diceHolder সেট করে।
   */
  retrieveToPlayer(playerId, onDone) {
    const g = this.game;
    // 3D characters না থাকলে (বা physics/diceMesh না থাকলে) কোনো
    // animation ছাড়াই শেষ — আগের instant behaviour-এ ফিরে যায়
    if (!g.characters || !g.physics || !g.diceMesh) {
      if (onDone) onDone();
      return;
    }
    // Dice ইতিমধ্যে হাতে ধরা — কিছু করার দরকার নেই
    if (g.physics.isHeld) {
      if (onDone) onDone();
      return;
    }

    const from = g.diceMesh.position.clone();   // board-এর বর্তমান অবস্থান
    const to = this._handPos(playerId);
    if (!to) { if (onDone) onDone(); return; }
    to.y += 0.17; // game.animate() holdAt যে offset ব্যবহার করে, সেটাই

    this._startFlight(from, to, 1.15, 0.68, () => {
      this.phase = 'IDLE';
      this.flight = null;
      if (onDone) onDone();
    });
  }

  /**
   * FLOW B — HANDOFF (turn শেষ → next player কে dice দেওয়া)
   * ধাপ:
   *   A) board → আগের player-এর হাত  (retrieve)
   *   B) আগের player আস্তে করে pass throw → dice উড়ে next player-এর হাতে
   *   C) next player catch করে, তারপর hold-pose — খেলা চলতে পারে
   */
  passToNextPlayer(fromPlayerId, toPlayerId, onDone) {
    const g = this.game;
    if (!g.characters || !g.physics || !g.diceMesh) {
      if (onDone) onDone();
      return;
    }

    const fromHand = this._handPos(fromPlayerId);
    const toHand = this._handPos(toPlayerId);
    if (!fromHand || !toHand) { if (onDone) onDone(); return; }
    fromHand.y += 0.17;
    toHand.y += 0.17;

    const finish = () => {
      this.phase = 'IDLE';
      this.flight = null;
      if (onDone) onDone();
    };

    // ধাপ B+C: pass throw শুরু — আগের player হাত নাড়ায় (release callback-এ
    // dice ছুটে যায়), একই সাথে next player catch pose নেয়
    const startPassThrow = () => {
      g.characters.startCatch(toPlayerId, 0.95);
      g.characters.startPass(fromPlayerId, () => {
        // release moment — dice এখন আগের হাত থেকে ছুটেছে
        this.phase = 'PASSING';
        const releasePos = this._handPos(fromPlayerId) || fromHand;
        releasePos.y += 0.17;
        this.flight = {
          from: releasePos,
          to: toHand,
          arcHeight: 2.1,          // উঁচু বাঁক — realistic lob pass
          duration: 0.88,
          elapsed: 0,
          tumble: true,            // উড়ার সময় dice আবর্তন করবে
          trail: true,             // মৃদু sparkle trail
          onDone: () => {
            if (window.soundEngine) window.soundEngine.playDiceTumble();
            // ধাপ C: ধরার পর ছোট্ট settle — এই সময় hand হতে অল্প নিচে
            // নেমে আসে, তারপর hold-pose সামলাবে
            this._startFlight(toHand, toHand.clone(), 0, 0.22, finish, { tumble: false });
          }
        };
      });
    };

    if (g.physics.isHeld) {
      // Dice আগের player-এর হাতেই আছে — retrieve ছাড়াই pass শুরু করো
      startPassThrow();
    } else {
      // ধাপ A: board থেকে আগের player-এর হাতে retrieve
      this._startFlight(g.diceMesh.position.clone(), fromHand, 1.15, 0.55, startPassThrow);
    }
  }

  // =========================================================
  //  PER-FRAME UPDATE  (game.animate() থেকে call হয়)
  // =========================================================
  update(delta) {
    if (this.phase === 'IDLE' || !this.flight) return;
    const g = this.game;
    if (!g.physics || !g.diceMesh) { this.cancel(); return; }

    const f = this.flight;
    f.elapsed += delta;
    const t = Math.min(1, f.duration > 0 ? f.elapsed / f.duration : 1);
    // easeInOutQuad — শুরু-শেষ ধীর, মাঝে দ্রুত (natural flight feel)
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // সরলরেখা lerp + উল্লম্ব প্যারাবলিক উচ্চতা = arc ধরে উড়া
    const x = f.from.x + (f.to.x - f.from.x) * ease;
    const y = f.from.y + (f.to.y - f.from.y) * ease + f.arcHeight * 4 * t * (1 - t);
    const z = f.from.z + (f.to.z - f.from.z) * ease;

    // holdAt: body কে kinematic রাখে (gravity কাজ করে না) + mesh sync
    g.physics.holdAt(x, y, z);

    // উড়ার সময় dice আবর্তন — mesh নয়, BODY quaternion ঘোরাতে হবে,
    // কারণ পরের ফ্রেমে holdAt আবার body থেকে mesh টেনে নেয়
    if (f.tumble) {
      const body = g.physics.diceBody;
      const spin = new CANNON.Quaternion();
      spin.setFromAxisAngle(new CANNON.Vec3(0.55, 1, 0.35).normalize(), delta * 7.5);
      body.quaternion.mult(spin, body.quaternion);
    }

    // মৃদু trail (dice-এর আগের real-roll-এর মতোই particle system ব্যবহার করে)
    if (f.trail && g.spawnDiceTrailParticle && Math.random() < 0.55) {
      g.spawnDiceTrailParticle(g.diceMesh.position);
    }

    if (t >= 1) {
      const cb = f.onDone;
      f.onDone = null;
      // cb নতুন flight শুরু করতে পারে (retrieve → pass chain), তাই
      // এখানে phase/flight পরিষ্কার করি না — cb/next-flight সামলাবে
      if (cb) cb();
    }
  }

  // =========================================================
  //  INTERNAL HELPERS
  // =========================================================

  /** খেলোয়াড়ের ডান হাতের world position (clone করে দেয়) */
  _handPos(playerId) {
    const g = this.game;
    if (!g.characters) return null;
    const hand = g.characters.getHandWorldPosition(playerId, g._tmpVec);
    return hand ? hand.clone() : null;
  }

  /** একটা নির্দিষ্ট arc flight শুরু করে (from → to, arcHeight সহ) */
  _startFlight(from, to, arcHeight, duration, onDone, opts = {}) {
    this.phase = 'FLYING';
    this.flight = {
      from, to, arcHeight, duration,
      elapsed: 0,
      onDone,
      tumble: opts.tumble !== false,
      trail: !!opts.trail
    };
  }
}

window.DiceHandoffSystem = DiceHandoffSystem;
