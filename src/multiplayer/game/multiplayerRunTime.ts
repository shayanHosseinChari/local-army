export const multiplayerRuntimeScript = String.raw`
function createMultiplayerRuntime(session, config, post) {
  const THREE = window.THREE;
  const world = createWorld(THREE, config);
  const controls = createControls(world, config);

  if (Array.isArray(world.enemies)) {
    world.enemies.forEach(function (enemy) {
      if (enemy.group) enemy.group.visible = false;
    });
  }

  if (world.target) world.target.visible = false;

  const isHost = session.role === "host";
  const localId = isHost ? "host" : "guest";

  const simulation = isHost ? createHostSimulation(world, config) : null;

  let running = false;
  let disposed = false;
  let frameId = 0;
  let previousTime = performance.now();
  let sendElapsed = 0;
  let inputSequence = 0;
  let lastSnapshotSequence = 0;
  let roundOver = false;
  let firePointer = null;
  let fireUntil = 0;
  let seenShots = 0;
  let seenHits = 0;
  let oldHealth = 100;

  const fireButton = document.getElementById('fireButton');

  // ============================================================
  // موتور صدا — فقط صدای شلیک
  // ============================================================
  let audioCtx = null;
  let masterGain = null;
  let masterComp = null;
  let soundEnabled = true;

  let activeShots = 0;
  const MAX_SHOTS = 6;

  let lastShootTime = 0;

  function makeNoiseBuffer(ctx, seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();

    masterComp = audioCtx.createDynamicsCompressor();
    masterComp.threshold.value = -14;
    masterComp.knee.value = 24;
    masterComp.ratio.value = 4;
    masterComp.attack.value = 0.003;
    masterComp.release.value = 0.15;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;

    masterComp.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    return audioCtx;
  }

  function connectToMaster(node, panValue) {
    if (panValue !== undefined && audioCtx.createStereoPanner) {
      const p = audioCtx.createStereoPanner();
      p.pan.value = panValue;
      node.connect(p);
      p.connect(masterComp);
    } else {
      node.connect(masterComp);
    }
  }

  // ---------- تنها صدای شلیک: ۴ لایه ----------
  function playShot() {
    const ctx = audioCtx;
    const now = ctx.currentTime;
    if (activeShots >= MAX_SHOTS) return;
    activeShots++;

    const noise = makeNoiseBuffer(ctx, 0.4);

    const trans = ctx.createBufferSource();
    trans.buffer = noise;
    const transHP = ctx.createBiquadFilter();
    transHP.type = 'highpass';
    transHP.frequency.value = 1800;
    const transGain = ctx.createGain();
    transGain.gain.setValueAtTime(0.9, now);
    transGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    trans.connect(transHP);
    transHP.connect(transGain);
    connectToMaster(transGain, (Math.random() - 0.5) * 0.3);
    trans.start(now);
    trans.stop(now + 0.05);

    const body = ctx.createBufferSource();
    body.buffer = noise;
    const bodyLP = ctx.createBiquadFilter();
    bodyLP.type = 'lowpass';
    bodyLP.frequency.setValueAtTime(3200, now);
    bodyLP.frequency.exponentialRampToValueAtTime(600, now + 0.28);
    bodyLP.Q.value = 0.9;
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.85, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    body.connect(bodyLP);
    bodyLP.connect(bodyGain);
    connectToMaster(bodyGain, 0);
    body.start(now);
    body.stop(now + 0.35);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    sub.connect(subGain);
    connectToMaster(subGain, 0);
    sub.start(now);
    sub.stop(now + 0.24);

    const crack = ctx.createOscillator();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(680, now);
    crack.frequency.exponentialRampToValueAtTime(420, now + 0.1);
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.22, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    crack.connect(crackGain);
    connectToMaster(crackGain, (Math.random() - 0.5) * 0.2);
    crack.start(now);
    crack.stop(now + 0.14);

    setTimeout(function () {
      activeShots = Math.max(0, activeShots - 1);
    }, 350);
  }

  function playShootSound() {
    if (!soundEnabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - lastShootTime < 0.03) return;
    lastShootTime = now;
    playShot();
  }

  const unlockAudio = function () {
    ensureAudio();
    document.removeEventListener('pointerdown', unlockAudio, true);
    document.removeEventListener('keydown', unlockAudio, true);
  };
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);

  // ============================================================
  // HUD امتیازات
  // ============================================================
  const hudStyle = document.createElement('style');
  hudStyle.textContent = [
    '@keyframes hudPulse {',
    '  0% { transform: scale(1); }',
    '  40% { transform: scale(1.18); }',
    '  100% { transform: scale(1); }',
    '}',
    '.hud-card {',
    '  display:flex; flex-direction:column; align-items:center; justify-content:center;',
    '  min-width:64px; padding:6px 10px; border-radius:14px;',
    '  background:linear-gradient(180deg, #1a2431ee, #0f1620ee);',
    '  border:1px solid #2c3f57;',
    '  box-shadow:0 2px 10px #0007, inset 0 1px 0 #ffffff10;',
    '  transition:border-color .2s, box-shadow .2s;',
    '}',
    '.hud-label {',
    '  font-size:9px; font-weight:800; letter-spacing:2px;',
    '  color:#7d8fa6; margin-bottom:2px;',
    '}',
    '.hud-value {',
    '  font-size:20px; font-weight:900; color:#e8eef7;',
    '  font-variant-numeric:tabular-nums; line-height:1;',
    '}',
    '.hud-value.pulse { animation: hudPulse .25s ease-out; }',
    '.hud-card.shots { border-color:#53a8ff55; }',
    '.hud-card.shots .hud-value { color:#8ec8ff; }',
    '.hud-card.hits { border-color:#73e6a255; }',
    '.hud-card.hits .hud-value { color:#73e6a2; }',
    '.hud-card.enemies { border-color:#ff646455; }',
    '.hud-card.enemies .hud-value { color:#ff8a8a; }',
    '.hud-card.enemies.safe { border-color:#3ddc8455; }',
    '.hud-card.enemies.safe .hud-value { color:#3ddc84; }'
  ].join('\n');
  document.head.appendChild(hudStyle);

  const scoreRoot = document.createElement('div');
  scoreRoot.style.cssText = [
    'position:fixed', 'top:14px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:50', 'pointer-events:none',
    "font-family:'Vazirmatn',system-ui,sans-serif",
    'display:flex', 'align-items:center', 'gap:10px'
  ].join(';');

  function makeHudCard(className, label) {
    const card = document.createElement('div');
    card.className = 'hud-card ' + className;
    const labelEl = document.createElement('div');
    labelEl.className = 'hud-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('div');
    valueEl.className = 'hud-value';
    valueEl.textContent = '0';
    card.appendChild(labelEl);
    card.appendChild(valueEl);
    return { card: card, valueEl: valueEl };
  }

  const shotsCard = makeHudCard('shots', 'SHOTS');
  const hitsCard  = makeHudCard('hits', 'HITS');
  const aliveCard = makeHudCard('enemies', 'ENEMIES');

  scoreRoot.append(shotsCard.card, hitsCard.card, aliveCard.card);
  document.body.appendChild(scoreRoot);

  let prevShots = -1;
  let prevHits = -1;
  let prevAlive = -1;

  function setHudValue(cardObj, value) {
    cardObj.valueEl.textContent = String(value);
    cardObj.valueEl.classList.remove('pulse');
    void cardObj.valueEl.offsetWidth;
    cardObj.valueEl.classList.add('pulse');
  }

  function updateScoreboard(shots, hits, alive) {
    if (shots !== prevShots) {
      setHudValue(shotsCard, shots);
      prevShots = shots;
    }
    if (hits !== prevHits) {
      setHudValue(hitsCard, hits);
      prevHits = hits;
    }
    if (alive !== prevAlive) {
      setHudValue(aliveCard, alive);
      if (alive > 0) {
        aliveCard.card.classList.remove('safe');
      } else {
        aliveCard.card.classList.add('safe');
      }
      prevAlive = alive;
    }
  }

  // ============================================================
  // افکت دمیج دریافتی
  // ============================================================
  const damageOverlay = document.createElement('div');
  damageOverlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:47', 'pointer-events:none', 'opacity:0',
    'background:radial-gradient(ellipse at center, transparent 45%, #ff000066 85%, #ff0000aa 100%)',
    'transition:opacity 0.12s ease-out'
  ].join(';');
  document.body.appendChild(damageOverlay);

  let damageTimeout = null;
  function playDamageEffect(intensity) {
    damageOverlay.style.opacity = String(Math.min(1, Math.max(0.35, intensity)));
    clearTimeout(damageTimeout);
    damageTimeout = setTimeout(function () { damageOverlay.style.opacity = '0'; }, 220);
  }

  // ============================================================
  // شنونده‌ها
  // ============================================================
  const removers = [];
  function listen(element, name, handler) {
    if (!element) return;
    element.addEventListener(name, handler);
    removers.push(function () { element.removeEventListener(name, handler); });
  }

  listen(fireButton, 'pointerdown', function (event) {
    ensureAudio();
    if (!running || roundOver || firePointer !== null) return;
    event.preventDefault();
    firePointer = event.pointerId;
    fireUntil = performance.now() + 100;
    fireButton.setPointerCapture(event.pointerId);
  });

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) {
    listen(fireButton, name, function (event) {
      if (firePointer !== event.pointerId) return;
      firePointer = null;
      if (name !== 'pointerup') fireUntil = 0;
    });
  });

  function animateClass(id, name) {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.remove(name);
    void element.offsetWidth;
    element.classList.add(name);
  }

  window.togglePause = function () {};
  window.switchMap = function () {};

  ['playPauseBtn', 'pauseMenu', 'gameOver', 'statsPanel', 'healthBar'].forEach(function (id) {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  });

  // ============================================================
  // افکت اصابت گلوله روی حریف
  // ============================================================
  const hitEffects = [];

  function spawnHitEffect(position) {
    if (!position) return;

    for (let i = 0; i < 4; i++) {
      const sparkGeo = new THREE.SphereGeometry(0.035, 6, 4);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0xffd27a,
        transparent: true,
        opacity: 1,
        depthWrite: false
      });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.copy(position);
      world.scene.add(spark);

      hitEffects.push({
        mesh: spark,
        type: 'spark',
        life: 0.35,
        maxLife: 0.35,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3.5,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 3.5
        )
      });
    }

    const ringGeo = new THREE.RingGeometry(0.05, 0.08, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5555,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    ring.lookAt(world.camera.position);
    world.scene.add(ring);

    hitEffects.push({
      mesh: ring,
      type: 'ring',
      life: 0.28,
      maxLife: 0.28,
      velocity: new THREE.Vector3(0, 0, 0)
    });
  }

  function updateHitEffects(delta) {
    for (let i = hitEffects.length - 1; i >= 0; i--) {
      const fx = hitEffects[i];
      fx.life -= delta;
      if (fx.life <= 0) {
        world.scene.remove(fx.mesh);
        if (fx.mesh.geometry) fx.mesh.geometry.dispose();
        if (fx.mesh.material) fx.mesh.material.dispose();
        hitEffects.splice(i, 1);
        continue;
      }
      const t = fx.life / fx.maxLife;

      if (fx.type === 'spark') {
        fx.velocity.y -= 9.8 * delta;
        fx.mesh.position.addScaledVector(fx.velocity, delta);
        fx.mesh.material.opacity = t;
        fx.mesh.scale.setScalar(0.5 + t * 0.5);
      } else if (fx.type === 'ring') {
        const s = 1 + (1 - t) * 4;
        fx.mesh.scale.setScalar(s);
        fx.mesh.material.opacity = t * 0.95;
        fx.mesh.lookAt(world.camera.position);
      }
    }
  }

  function clearHitEffects() {
    hitEffects.forEach(function (fx) {
      world.scene.remove(fx.mesh);
      if (fx.mesh.geometry) fx.mesh.geometry.dispose();
      if (fx.mesh.material) fx.mesh.material.dispose();
    });
    hitEffects.length = 0;
  }

  // ============================================================
  // مدل بازیکن مقابل
  // ============================================================
  const PLAYER_COLORS = [0x53a8ff, 0xffa34d, 0xb06bff, 0x4dd0e1, 0xff6b9d, 0x9ccc65];

  function createAvatar(color) {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.15, 12),
      bodyMaterial
    );
    body.position.y = 0.75;
    group.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xf2c6a0 })
    );
    head.position.y = 1.5;
    group.add(head);
    const direction = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    direction.position.set(0, 1.5, -0.3);
    group.add(direction);
    group.visible = false;
    group.userData.bodyMaterial = bodyMaterial;
    return group;
  }

  const remotePlayers = new Map();

  function getOrCreateRemotePlayer(id) {
    let rp = remotePlayers.get(id);
    if (rp) return rp;
    const colorIndex = remotePlayers.size % PLAYER_COLORS.length;
    const group = createAvatar(PLAYER_COLORS[colorIndex]);
    world.scene.add(group);
    rp = {
      id: id,
      group: group,
      target: new THREE.Vector3(),
      yaw: 0,
      hasState: false,
      health: 100,
      prevHealth: 100,
      hitFlash: 0,
      bodyMaterial: group.userData.bodyMaterial
    };
    remotePlayers.set(id, rp);
    return rp;
  }

  function removeRemotePlayer(id) {
    const rp = remotePlayers.get(id);
    if (!rp) return;
    world.scene.remove(rp.group);
    rp.group.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose(); });
        else obj.material.dispose();
      }
    });
    remotePlayers.delete(id);
  }

  const localTarget = new THREE.Vector3();
  let hasLocalState = false;

  function shortestAngleDifference(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  function updatePresentation(delta) {
    if (!isHost && hasLocalState) {
      if (world.camera.position.distanceToSquared(localTarget) > 9) {
        world.camera.position.copy(localTarget);
      } else {
        const alpha = 1 - Math.exp(-25 * delta);
        world.camera.position.lerp(localTarget, alpha);
      }
    }
    const alpha = 1 - Math.exp(-18 * delta);
    remotePlayers.forEach(function (rp) {
      if (!rp.hasState) return;
      if (rp.group.position.distanceToSquared(rp.target) > 9) {
        rp.group.position.copy(rp.target);
        rp.group.rotation.y = rp.yaw;
      } else {
        rp.group.position.lerp(rp.target, alpha);
        rp.group.rotation.y += shortestAngleDifference(rp.group.rotation.y, rp.yaw) * alpha;
      }

      if (rp.hitFlash > 0 && rp.bodyMaterial) {
        rp.hitFlash = Math.max(0, rp.hitFlash - delta);
        const flash = rp.hitFlash / 0.18;
        rp.bodyMaterial.emissive.setRGB(flash, 0, 0);
        rp.bodyMaterial.emissiveIntensity = flash * 2;
      } else if (rp.bodyMaterial) {
        rp.bodyMaterial.emissive.setRGB(0, 0, 0);
        rp.bodyMaterial.emissiveIntensity = 0;
      }
    });
  }

  function applySnapshot(message) {
    const payload = message.payload;
    if (payload.matchId !== session.matchId || payload.sequence <= lastSnapshotSequence) return;

    lastSnapshotSequence = payload.sequence;
    const local = payload.players.find(function (p) { return p.id === localId; });
    if (!local) return;

    if (local.shots > seenShots) {
      animateClass('crosshair', 'firing');
      if (world.gun && world.gun.triggerRecoil) world.gun.triggerRecoil();
      playShootSound();
    }

    if (local.health < oldHealth) {
      const dmg = oldHealth - local.health;
      const intensity = 0.35 + dmg / 40;
      playDamageEffect(intensity);
      if (!isHost) {
        world.camera.rotation.z = (Math.random() - 0.5) * 0.02;
        setTimeout(function () { world.camera.rotation.z = 0; }, 90);
      }
    }

    seenShots = local.shots;
    seenHits  = local.hits;
    oldHealth = local.health;

    const presentIds = new Set();
    let aliveFoes = 0;

    payload.players.forEach(function (player) {
      if (player.id === localId) {
        localTarget.set(player.position.x, player.position.y, player.position.z);
        if (isHost || !hasLocalState) world.camera.position.copy(localTarget);
        hasLocalState = true;
        return;
      }
      presentIds.add(player.id);
      const rp = getOrCreateRemotePlayer(player.id);
      rp.target.set(player.position.x, player.position.y - config.player.eyeHeight, player.position.z);
      rp.yaw = player.yaw;
      if (!rp.hasState) {
        rp.group.position.copy(rp.target);
        rp.group.rotation.y = rp.yaw;
        rp.prevHealth = player.health;
      }

      if (rp.hasState && player.health < rp.prevHealth) {
        const fxPos = new THREE.Vector3(
          rp.target.x + (Math.random() - 0.5) * 0.25,
          rp.target.y + 1.0,
          rp.target.z + (Math.random() - 0.5) * 0.25
        );
        spawnHitEffect(fxPos);
        rp.hitFlash = 0.18;
      }

      rp.prevHealth = player.health;
      rp.hasState = true;
      rp.health = player.health;
      rp.group.visible = player.health > 0;
      if (player.health > 0) aliveFoes += 1;
    });

    Array.from(remotePlayers.keys()).forEach(function (id) {
      if (!presentIds.has(id)) removeRemotePlayer(id);
    });

    updateScoreboard(local.shots, local.hits, aliveFoes);

    roundOver = local.health <= 0 || aliveFoes === 0;
    if (roundOver) {
      resetInput();
      if (fireButton) fireButton.style.display = 'none';
    }
  }

  function sampleInput() {
    return {
      moveX: controls.input.x,
      moveZ: controls.input.y,
      yaw: world.camera.rotation.y,
      pitch: world.camera.rotation.x,
      jump: false,
      fire: !roundOver && !document.hidden &&
        (firePointer !== null || performance.now() < fireUntil)
    };
  }

  function receive(message) {
    if (disposed || !message || !message.payload || message.payload.matchId !== session.matchId) return;
    if (isHost && message.type === "game/input") {
      simulation.setInput("guest", message.payload.input, message.payload.sequence, performance.now());
    }
    if (!isHost && message.type === "game/snapshot") {
      applySnapshot(message);
    }
  }

  function start() {
    if (disposed || running) return;
    controls.reset();
    previousTime = performance.now();
    sendElapsed = 0;
    running = true;
  }

  function frame(now) {
    if (disposed) return;
    try {
      const delta = Math.max(0, Math.min((now - previousTime) / 1000, 0.1));
      previousTime = now;
      if (running) {
        sendElapsed += delta;
        let currentSnapshot = null;
        if (isHost) {
          inputSequence += 1;
          simulation.setInput("host", sampleInput(), inputSequence, now);
          simulation.advance(delta, now);
          currentSnapshot = simulation.snapshot(session.matchId);
          applySnapshot(currentSnapshot);
        }
        if (sendElapsed >= 0.05) {
          sendElapsed %= 0.05;
          if (isHost) {
            post("multiplayer/network", { message: currentSnapshot });
          } else {
            inputSequence += 1;
            post("multiplayer/network", {
              message: {
                type: "game/input",
                payload: { matchId: session.matchId, sequence: inputSequence, input: sampleInput() }
              }
            });
          }
        }
        updatePresentation(delta);
        updateHitEffects(delta);
        if (world.gun && world.gun.updateGun) {
          world.gun.updateGun(delta, controls.input);
        }
      }
      world.renderer.render(world.scene, world.camera);
      frameId = requestAnimationFrame(frame);
    } catch (error) {
      running = false;
      post("multiplayer/error", { message: error instanceof Error ? error.message : String(error) });
    }
  }

  function resetInput() {
    firePointer = null;
    fireUntil = 0;
    controls.reset();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    running = false;
    cancelAnimationFrame(frameId);

    window.removeEventListener("resize", world.resize);
    window.removeEventListener("blur", resetInput);
    document.removeEventListener("visibilitychange", resetInput);

    removers.forEach(function (remove) { remove(); });

    document.removeEventListener('pointerdown', unlockAudio, true);
    document.removeEventListener('keydown', unlockAudio, true);
    if (audioCtx) {
      audioCtx.close().catch(function () {});
      audioCtx = null;
      masterGain = null;
      masterComp = null;
    }

    clearHitEffects();
    Array.from(remotePlayers.keys()).forEach(removeRemotePlayer);

    clearTimeout(damageTimeout);
    damageOverlay.remove();
    scoreRoot.remove();
    if (hudStyle.parentNode) hudStyle.parentNode.removeChild(hudStyle);

    controls.dispose();
    world.dispose();
  }

  window.addEventListener("resize", world.resize);
  window.addEventListener("blur", resetInput);
  document.addEventListener("visibilitychange", resetInput);

  world.resize();
  world.renderer.render(world.scene, world.camera);
  frameId = requestAnimationFrame(frame);

  return { start: start, receive: receive, dispose: dispose };
}
`;
