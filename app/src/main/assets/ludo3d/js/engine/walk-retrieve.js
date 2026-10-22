/**
 * ================================================================
 *  WALK RETRIEVE SYSTEM   —   walk-retrieve.js
 * ================================================================
 *
 *  Bonus (double move) roll-এ realistic retrieval: dice যখন board-এ
 *  পড়ে থাকে এবং একই player আবার পাবে (৬ ছুড়েছে / capture করেছে), তখন
 *  dice ম্যাজিক দিয়ে হাতে উড়ে আসে না — বরং 3D player নিজে podium
 *  (lobby) থেকে নেমে হেঁটে board-এ যায়, dice তুলে নেয়, আবার উঠে
 *  এসে podium-এ দাঁড়ায় — তারপর সে আবার board-এ throw করে।
 *
 *  ⚠️ SEPARATION OF LOGIC (ভবিষ্যতের AI-দের জন্য) — তিনটা আলাদা
 *  mechanism, তিনটাই আলাদা file-এ, মিশাবে না:
 *    • BOARD THROW   — dice-board-throw.js  (হাত থেকে board-এ physics throw)
 *    • HANDOFF       — dice-handoff.js      (board↔hand arc + player pass)
 *    • WALK RETRIEVE — এই file              (চরিত্র নিজে হেঁটে dice তোলে;
 *                                             শুধু BONUS turn-এ ব্যবহৃত)
 *
 *  ---------------------------------------------------------------
 *  FLOW (game.js finishMove — bonus পেলে call হয়):
 *    ১) OUT   — podium → podium-এর কাছে rim (ground) → board-এর প্রান্ত
 *               → dice-র পাশে হেঁটে যাওয়া (legs/arms swing — characters.js)
 *    ২) PICK  — হোঁচট দিয়ে ঝুঁকে হাত নামানো (crouch 0→1)
 *    ৩) LIFT  — dice board থেকে হাতে উঠে আসে (smooth lerp), crouch 1→0
 *    ৪) BACK  — dice ডান হাতে ধরে আবার podium-এ হেঁটে ফেরা
 *    ৫) DONE  — body আগের জায়গায় ফেরে + onDone() (holder + schedule)
 *
 *  ---------------------------------------------------------------
 *  GEOMETRY (board.js/characters.js/physics.js থেকে মান):
 *    • podium (group) সব top/bottom edge-এ: |z| = 11.5, |x| = 4.8
 *    • podium feet y = 0.2 (pedestal surface), ground (rim) y ≈ 0.05,
 *      board surface y = 0.22, dice rest y = 0.95 (half-extent 0.55)
 *    • boardSize 18 → half 9.0; dice playable clamp ±8.4
 *    • approach সবসময় ±z দিয়ে (সব podium উপরে/নিচে edge-এ)
 *
 *  ---------------------------------------------------------------
 *  MOTION OWNERSHIP (কে কী চালায়):
 *    • চরিত্রের body position/rotation (হাঁটা পথ) — এই file
 *    • হাত/পা/ঘোরানো walk-cycle poses  — characters.js (`walkAnim`,
 *      startWalk/setWalkPhase/setWalkCarry/stopWalk)
 *    • dice ফলো: LIFT-এ এই file নিজে holdAt(lerp) করে; LIFT শেষে
 *      game.diceHolder = playerId বসায় → এরপর animate() এর holdAt
 *      প্রতি frame hand position নেয় (bone hierarchy থেকে — body
 *      সরলেই hand সরে, তাই dice হাঁটা দেহের সাথে যায়)
 *
 *  ---------------------------------------------------------------
 *  GAME.JS contract:
 *    • walk চলাকালীন isBusy() = true:
 *        – handleRoll এটা দেখে human tap ignore / AI retry পাঠায়
 *        – animate() এর diceHolder auto-assign থামে (pickup আগে dice
 *          হাতে টেনে নেওয়া যাবে না)
 *    • start-এ: game.diceHolder = -1 (dice থাকে board-এ)
 *    • LIFT শেষে ও DONE-এ: game.diceHolder = playerId
 *    • onDone: bonus-এর আগের contract মতো (holder + notifyUI + AI schedule)
 *    • cancel(): stopRunning()/newGame()/newSnakeLadderGame()/initBoard
 *      থেকে ডাকা হয় — মাঝপথে না থামলে চরিত্র বাইরে আটকে থাকে
 *    • Safety: MAX_DURATION ছাড়ালে জবরদখ্তে শেষ (game stuck হবে না)
 */

class WalkRetrieveSystem {
  constructor(game) {
    this.game = game;
    // Phase machine: 'IDLE' | 'OUT' | 'PICK' | 'LIFT' | 'BACK'
    this.phase = 'IDLE';
    this.playerId = -1;
    this.onDone = null;
    // হাঁটার পথ waypoints (world-space) — node = বর্তমান লক্ষ্য
    this.path = null;
    this.node = 0;
    // base position (bob বাদে) — body এখানে থাকে, bob যোগ হয় render-এ
    this.walkX = 0; this.walkY = 0.2; this.walkZ = 0;
    this.diceStart = null;
    this.pickT = 0;
    this.liftT = 0;
    this.elapsed = 0;

    // Tuning
    this.SPEED = 5.2;        // units/second হাঁটার গতি
    this.PICK_REACH = 0.35;  // ঝুঁকে হাত নামানোর সময় (s)
    this.PICK_HOLD = 0.42;   // grab হওয়ার আগে ছোট অপেক্ষা (s)
    this.LIFT_DUR = 0.30;    // dice হাতে ওঠার সময় (s)
    this.MAX_DURATION = 14;  // safety watchdog (s)
  }

  isBusy() {
    return this.phase !== 'IDLE';
  }

  // =========================================================
  //  PUBLIC API
  // =========================================================

  /**
   * শুরু — playerId হেঁটে dice তুলে ফিরবে, শেষ হলে onDone() ডাকা হবে।
   * (যদি শুরুই না হয় — কিছু না থাকলে — সাথে সাথে onDone, busy থাকবে না,
   *  তাই caller-এর fallback পথ চালু থাকে।)
   */
  start(playerId, onDone) {
    if (this.isBusy()) this.cancel();

    const g = this.game;
    const chars = g.characters;
    const ch = chars && chars.chars && chars.chars[playerId];
    if (!ch || !g.physics || !g.physics.diceBody) {
      if (onDone) onDone();
      return;
    }

    this.playerId = playerId;
    this.onDone = onDone;
    this.elapsed = 0;
    this.pickT = 0;
    this.liftT = 0;

    // dice কোথায় পড়ে আছে — সেখানেই হেঁটে যাবে
    const d = g.physics.diceBody.position;
    this.diceStart = { x: d.x, y: d.y, z: d.z };

    const [px, pz] = chars.positions[playerId];
    const sz = pz > 0 ? 1 : -1;               // podium bottom(+) / top(−)
    const rimZ = pz - sz * 1.15;               // podium এর কাছের ground
    const edgeZ = sz * 8.9;                    // board surface-এর প্রান্ত (half 9.0)

    // পথ: podium → rim → board edge → dice  (BACK এ উল্টো)
    this.pathOut = [
      { x: px, y: 0.20, z: pz },
      { x: px, y: 0.05, z: rimZ },
      { x: px, y: 0.22, z: edgeZ },
      { x: d.x, y: 0.22, z: d.z }
    ];
    this.pathBack = [
      { x: d.x, y: 0.22, z: d.z },
      { x: px, y: 0.22, z: edgeZ },
      { x: px, y: 0.05, z: rimZ },
      { x: px, y: 0.20, z: pz }
    ];
    this.path = this.pathOut;
    this.node = 0;
    this.walkX = ch.body.position.x;
    this.walkY = ch.body.position.y;
    this.walkZ = ch.body.position.z;

    this.phase = 'OUT';
    // pickup আগে dice board-এ থাকবে — animate() হাতে টেনে নেবে না
    g.diceHolder = -1;

    chars.startWalk(playerId);
    if (window.SysLogs) window.SysLogs.push('game', 'Walk-retrieve: P' + (playerId + 1) + ' fetching dice');
  }

  /**
   * মাঝপথে বাতিল — game বন্ধ/নতুন হলে। চরিত্র আগের জায়গায় ফিরবে,
   * onDone ডাকা হবে না (caller নিজের fallback দেখবে — যেমন stopRunning)।
   */
  cancel() {
    const chars = this.game.characters;
    if (chars && this.playerId >= 0 && chars.chars && chars.chars[this.playerId]) {
      chars.stopWalk(this.playerId);
    }
    this.phase = 'IDLE';
    this.onDone = null;
    this.playerId = -1;
  }

  // =========================================================
  //  PER-FRAME UPDATE  (game.animate() থেকে call হয়)
  // =========================================================

  update(delta) {
    if (this.phase === 'IDLE') return;

    const g = this.game;
    const chars = g.characters;
    const ch = chars && chars.chars && chars.chars[this.playerId];
    this.elapsed += delta;

    // Safety: চরিত্র/anim হারালে বা অতিরিক্ত দেরি হলে জবরদখ্তে শেষ —
    // নাহলে isBusy() চিরতরে থেকে handleRoll বন্ধ হয়ে যায়
    if (!ch || !ch.walkAnim || this.elapsed > this.MAX_DURATION) {
      this._forceFinish();
      return;
    }

    const wa = ch.walkAnim;

    if (this.phase === 'OUT' || this.phase === 'BACK') {
      this._walkAlong(ch, wa, delta);
      if (this.node >= this.path.length) {
        if (this.phase === 'OUT') {
          // dice পাশে পৌঁছে গেলে — ঝুঁকে তোলার জন্য প্রস্তুত
          this.phase = 'PICK';
          this.pickT = 0;
          wa.crouch = 0;
          chars.setWalkPhase(this.playerId, 'pick');
        } else {
          this._finish();
        }
      }

    } else if (this.phase === 'PICK') {
      this.pickT += delta;
      wa.crouch = Math.min(1, this.pickT / this.PICK_REACH);
      // ঝুঁকে নামা: board height থেকে dip + (walk cycle নেই, bob নেই)
      ch.body.position.y = this.walkY - wa.crouch * 0.16;
      if (this.pickT >= this.PICK_HOLD) {
        this.phase = 'LIFT';
        this.liftT = 0;
      }

    } else if (this.phase === 'LIFT') {
      this.liftT += delta;
      const e = Math.min(1, this.liftT / this.LIFT_DUR);
      const smooth = e * e * (3 - 2 * e);
      wa.crouch = 1 - e;
      ch.body.position.y = this.walkY - wa.crouch * 0.16;

      // dice: board থেকে হাতে ধীরে উঠে আসে (হাত নিচে থাকায় snap দেখা যায় না)
      const hand = chars.getHandWorldPosition(this.playerId, g._tmpVec);
      if (hand) {
        const s = this.diceStart;
        g.physics.holdAt(
          s.x + (hand.x - s.x) * smooth,
          s.y + 0.17 + ((hand.y + 0.17) - s.y) * smooth,
          s.z + (hand.z - s.z) * smooth
        );
      }

      if (e >= 1) {
        // grab সম্পূর্ণ — এরপর animate() এর holdAt দিয়ে dice হাঁটা দেহের সাথে যাবে
        g.diceHolder = this.playerId;
        wa.crouch = 0;
        chars.setWalkCarry(this.playerId, true);
        chars.setWalkPhase(this.playerId, 'walk');
        this.path = this.pathBack;
        this.node = 0;
        this.phase = 'BACK';
      }
    }
  }

  // =========================================================
  //  INTERNALS
  // =========================================================

  /** এক segment পথ হেঁটে যাওয়া + মুখ ঘোরানো + body লেখা */
  _walkAlong(ch, wa, delta) {
    let remain = this.SPEED * delta;
    while (remain > 0 && this.node < this.path.length) {
      const tgt = this.path[this.node];
      const dx = tgt.x - this.walkX;
      const dy = tgt.y - this.walkY;
      const dz = tgt.z - this.walkZ;
      const dist = Math.hypot(dx, dy, dz);
      if (dist <= remain) {
        this.walkX = tgt.x; this.walkY = tgt.y; this.walkZ = tgt.z;
        remain -= dist;
        this.node++;
      } else {
        const k = remain / dist;
        this.walkX += dx * k;
        this.walkY += dy * k;
        this.walkZ += dz * k;
        remain = 0;
      }
    }

    // হাঁটার সময় হালকা উঁচু-নিচু ঝাঁকুনি (bob) — stride characters.js
    // এর walkAnim.t দিয়েই আসে, তাই সেটাই ব্যবহার (sync থাকে)
    const bob = wa.phase === 'walk' ? Math.abs(Math.sin(wa.t * 9.5)) * 0.05 : 0;
    ch.body.position.x = this.walkX;
    ch.body.position.y = this.walkY + bob;
    ch.body.position.z = this.walkZ;

    // হাঁটার দিকে মুখ ঘোরানো (smooth)
    if (this.node < this.path.length) {
      const tgt = this.path[this.node];
      const fx = tgt.x - this.walkX;
      const fz = tgt.z - this.walkZ;
      if (fx * fx + fz * fz > 0.0004) {
        // convention: চরিত্রের local +Z = সামনে (group.rotation.y = atan2(-x,-z))
        const worldYaw = Math.atan2(fx, fz);
        const target = worldYaw - ch.group.rotation.y;
        const targetLocal = Math.atan2(Math.sin(target), Math.cos(target));
        const cur = ch.body.rotation.y;
        const diff = Math.atan2(Math.sin(targetLocal - cur), Math.cos(targetLocal - cur));
        ch.body.rotation.y = cur + diff * Math.min(1, delta * 10);
      }
    }
  }

  /** সফল সমাপ্তি — body ফিরবে + onDone() */
  _finish() {
    const g = this.game;
    const chars = g.characters;
    if (chars && this.playerId >= 0 && chars.chars && chars.chars[this.playerId]) {
      chars.stopWalk(this.playerId);
    }
    // dice হাতে নিশ্চিত — animate holdAt এটা বজায় রাখবে
    g.diceHolder = this.playerId;
    this.phase = 'IDLE';
    const cb = this.onDone;
    this.onDone = null;
    this.playerId = -1;
    if (cb) {
      try { cb(); } catch (e) {
        if (window.SysLogs) window.SysLogs.push('game', 'Walk-retrieve onDone error: ' + (e && e.message));
      }
    }
  }

  /** জবরদখ্তে শেষ (চরিত্র হারানো / timeout) — onDone এবনেই ডাকা হয় */
  _forceFinish() {
    if (window.SysLogs) window.SysLogs.push('game', 'Walk-retrieve force-finish (phase=' + this.phase + ')');
    this._finish();
  }
}

window.WalkRetrieveSystem = WalkRetrieveSystem;
