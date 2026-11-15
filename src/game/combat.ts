export const combatScript = String.raw`
function createCombat(THREE, world, config, setStatus) {
  const button = document.getElementById('fireButton');
  const crosshair = document.getElementById('crosshair');
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  let lastShotAt = -Infinity;
  let respawnAt = 0;
  let enabled = true;
  let gameOver = false;

  let firing = false;
  let autoFireTimer = null;

  // ===== سلامت =====
  const MAX_HEALTH = 100;
  let health = MAX_HEALTH;
  const healthFill = document.getElementById('healthFill');
  const healthCurrent = document.getElementById('healthCurrent');
  const damageOverlay = document.getElementById('damageOverlay');
  const gameOverEl = document.getElementById('gameOver');

  function updateHealthUI() {
    if (!healthFill) return;
    const pct = Math.max(0, health) / MAX_HEALTH;
    const circumference = 2 * Math.PI * 42;
    healthFill.style.strokeDashoffset = circumference * (1 - pct);

    healthFill.classList.remove('warning', 'danger');
    const bar = document.getElementById('healthBar');
    if (bar) bar.classList.remove('danger', 'warning');

    if (pct < 0.3) {
      healthFill.classList.add('danger');
      if (bar) bar.classList.add('danger');
    } else if (pct < 0.6) {
      healthFill.classList.add('warning');
      if (bar) bar.classList.add('warning');
    }

    if (healthCurrent) healthCurrent.textContent = Math.max(0, Math.round(health));
  }

  function takeDamage(amount) {
    if (gameOver) return;
    health -= amount;
    updateHealthUI();
    if (damageOverlay) {
      damageOverlay.classList.remove('hit');
      void damageOverlay.offsetWidth;
      damageOverlay.classList.add('hit');
    }
    if (health <= 0) triggerGameOver();
  }

  function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    health = 0;
    updateHealthUI();
    enabled = false;
    firing = false;
    stopAutoFire();
    if (gameOverEl) {
      document.getElementById('finalKills').textContent = window.gameStats ? window.gameStats.kills : 0;
      document.getElementById('finalScore').textContent = window.gameStats ? window.gameStats.score : 0;
      gameOverEl.classList.add('show');
    }
  }

  window.applyPlayerDamage = function(amount) {
    if (!gameOver) takeDamage(amount);
  };

  const restartBtn = document.getElementById('restartButton');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      health = MAX_HEALTH;
      gameOver = false;
      enabled = true;
      updateHealthUI();
      if (gameOverEl) gameOverEl.classList.remove('show');
      if (window.gameStats) {
        window.gameStats.kills = 0;
        window.gameStats.shots = 0;
        window.gameStats.score = 0;
        if (window.setKillCount) window.setKillCount(0);
        if (window.setShotCount) window.setShotCount(0);
        if (window.setScore) window.setScore(0);
      }
    });
  }

  updateHealthUI();

  // ===== صدا =====
  let audioCtx = null;
  let singleShotBuffer = null;
  let autoFireBuffer = null;
  let soundsLoading = false;
  let soundsReady = false;
  let enemyShotCooldown = 0;

  const impacts = [];
  const MAX_IMPACTS = 50;
  const impactGeo = new THREE.CircleGeometry(0.1, 12);
  const impactHoleGeo = new THREE.CircleGeometry(0.04, 10);

  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function decodeBase64(base64, callback) {
    if (!base64 || base64.length < 50) { callback(null); return; }
    const ctx = ensureAudio();
    if (!ctx) { callback(null); return; }
    try {
      let raw = base64;
      const commaIdx = base64.indexOf(',');
      if (commaIdx !== -1 && base64.indexOf('base64') !== -1) {
        raw = base64.substring(commaIdx + 1);
      }
      raw = raw.replace(/\s/g, '');
      const binary = atob(raw);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      ctx.decodeAudioData(bytes.buffer,
        function(buf) { callback(buf); },
        function() { callback(null); });
    } catch (e) { callback(null); }
  }

  function loadAllSounds() {
    if (soundsLoading || soundsReady) return;
    soundsLoading = true;
    let pending = 2;
    function done() {
      pending--;
      if (pending === 0) { soundsReady = true; soundsLoading = false; }
    }
    decodeBase64(config.weapon.singleShotSoundBase64, function(buf) {
      singleShotBuffer = buf; done();
    });
    decodeBase64(config.weapon.autoFireSoundBase64, function(buf) {
      autoFireBuffer = buf; done();
    });
  }

  function playBuffer(buffer, pitchVar, volumeScale) {
    if (!buffer) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = (config.weapon.shotSoundVolume || 0.5) * (volumeScale || 1);
    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1 + (Math.random() - 0.5) * (pitchVar || 0.1);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + buffer.duration);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    } catch (e) {}
  }

  function playShotSound(isAuto) {
    if (isAuto && autoFireBuffer) playBuffer(autoFireBuffer, 0.15);
    else if (!isAuto && singleShotBuffer) playBuffer(singleShotBuffer, 0.05);
    else if (singleShotBuffer) playBuffer(singleShotBuffer, 0.1);
  }

  window.playEnemyShotSound = function(isAuto) {
    const now = performance.now();
    if (now - enemyShotCooldown < 50) return;
    enemyShotCooldown = now;

    if (isAuto && autoFireBuffer) {
      playBuffer(autoFireBuffer, 0.25, 0.6);
    } else if (!isAuto && singleShotBuffer) {
      playBuffer(singleShotBuffer, 0.2, 0.65);
    } else if (singleShotBuffer) {
      playBuffer(singleShotBuffer, 0.25, 0.6);
    }
  };

  function clearStatus() { setStatus(''); }

  function spawnImpact(point, normal, onTarget, type) {
    const n = normal ? normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const adjustedPoint = point.clone().addScaledVector(n, 0.015);

    if (type !== 'blood') {
      const outerMat = new THREE.MeshBasicMaterial({
        color: onTarget ? 0xff5555 : 0x8a8a8a,
        transparent: true, opacity: 0.6,
        depthWrite: false, side: THREE.DoubleSide
      });
      const outer = new THREE.Mesh(impactGeo, outerMat);
      outer.position.copy(adjustedPoint);
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), n
      );
      outer.quaternion.copy(q);
      world.scene.add(outer);
      impacts.push({ mesh: outer, life: 12, maxLife: 12, fadeStart: 10, isSpark: false });

      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x000000, transparent: true, opacity: 0.9,
        depthWrite: false, side: THREE.DoubleSide
      });
      const inner = new THREE.Mesh(impactHoleGeo, innerMat);
      inner.position.copy(adjustedPoint);
      inner.position.addScaledVector(n, 0.001);
      inner.quaternion.copy(q);
      world.scene.add(inner);
      impacts.push({ mesh: inner, life: 12, maxLife: 12, fadeStart: 10, isSpark: false });
    }

    while (impacts.length > MAX_IMPACTS) {
      const oldest = impacts.shift();
      world.scene.remove(oldest.mesh);
      oldest.mesh.geometry.dispose();
      oldest.mesh.material.dispose();
    }

    const isBlood = type === 'blood';
    const particleColor = isBlood ? 0xaa0000 : 0x8a7a5a;
    const particleCount = isBlood ? 10 : 6;

    for (let i = 0; i < particleCount; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: particleColor, transparent: true, opacity: 0.9,
        depthWrite: false
      });
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(isBlood ? 0.04 : 0.03, 4, 4),
        pMat
      );
      p.position.copy(point);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );
      vel.addScaledVector(n, isBlood ? 2 : 1.5);

      world.scene.add(p);
      impacts.push({
        mesh: p,
        life: isBlood ? 0.6 : 0.35,
        maxLife: isBlood ? 0.6 : 0.35,
        fadeStart: 0.15,
        isSpark: true,
        velocity: vel
      });
    }
  }

  function updateEffects(delta) {
    if (!delta || delta <= 0) return;
    for (let i = impacts.length - 1; i >= 0; i--) {
      const im = impacts[i];
      im.life -= delta;
      if (im.isSpark && im.velocity) {
        im.mesh.position.addScaledVector(im.velocity, delta);
        im.velocity.y -= 9.8 * delta;
        im.mesh.material.opacity = Math.max(0, im.life / im.maxLife);
      } else if (im.life < im.fadeStart) {
        im.mesh.material.opacity = Math.max(0, (im.life / im.fadeStart) * 0.85);
      }
      if (im.life <= 0) {
        world.scene.remove(im.mesh);
        im.mesh.geometry.dispose();
        im.mesh.material.dispose();
        impacts.splice(i, 1);
      }
    }
  }

  function fireOnce(isAuto) {
    if (gameOver) return false;
    const now = performance.now();
    if (!enabled || document.hidden || now - lastShotAt < config.weapon.cooldownMs) return false;
    lastShotAt = now;

    playShotSound(isAuto);
    if (window.incrementShot) window.incrementShot();
    if (world.gun && world.gun.triggerRecoil) world.gun.triggerRecoil();

    crosshair.classList.remove('firing');
    void crosshair.offsetWidth;
    crosshair.classList.add('firing');

    world.scene.updateMatrixWorld(true);
    world.camera.updateMatrixWorld(true);
    raycaster.setFromCamera(center, world.camera);

    const allTargets = world.shootables.filter(function(o) { return o.visible; });
    const hits = raycaster.intersectObjects(allTargets, true);

    if (hits.length > 0) {
      const hitObj = hits[0].object;
      const hitPoint = hits[0].point.clone();
      const hitNormal = hits[0].face
        ? hits[0].face.normal.clone().transformDirection(hitObj.matrixWorld)
        : new THREE.Vector3(0, 1, 0);

      let hitEnemy = null;
      let isHeadshot = false;
      for (let i = 0; i < world.enemies.length; i++) {
        const e = world.enemies[i];
        if (!e.alive) continue;
        let obj = hitObj;
        while (obj) {
          if (obj === e.group) {
            hitEnemy = e;
            break;
          }
          obj = obj.parent;
        }
        if (hitEnemy) {
          let checkObj = hitObj;
          while (checkObj) {
            if (checkObj.userData && checkObj.userData.isHead) {
              isHeadshot = true;
              break;
            }
            checkObj = checkObj.parent;
          }
          break;
        }
      }

      const hitTarget = hitObj === world.target;
      const isKill = hitEnemy !== null || hitTarget;

      spawnImpact(hitPoint, hitNormal, isKill, hitEnemy !== null ? 'blood' : 'dust');

      if (hitEnemy && world.hitEnemyEffect) {
        world.hitEnemyEffect(hitEnemy);
      }

      const hm = document.getElementById('hitmarker');
      if (hm) {
        hm.classList.remove('show', 'kill', 'headshot');
        void hm.offsetWidth;
        if (isHeadshot) hm.classList.add('headshot');
        else if (isKill) hm.classList.add('kill');
        hm.classList.add('show');
      }

      if (hitEnemy) {
        hitEnemy.alive = false;
        hitEnemy.group.visible = false;
        hitEnemy.respawnAt = now + 2000;

        const points = isHeadshot
          ? config.weapon.pointsPerHit * (config.weapon.headshotMultiplier || 2)
          : config.weapon.pointsPerHit;
        if (window.incrementKill) window.incrementKill(points);
      } else if (hitTarget) {
        if (window.incrementKill) window.incrementKill(config.weapon.pointsPerHit);
        world.target.visible = false;
        crosshair.classList.add('hit');
        respawnAt = now + config.weapon.respawnMs;
      }
    }
    return true;
  }

  function startAutoFire() {
    if (autoFireTimer) return;
    fireOnce(true);
    autoFireTimer = setInterval(function() {
      if (!firing || !enabled) { stopAutoFire(); return; }
      fireOnce(true);
    }, config.weapon.autoFireIntervalMs || 140);
  }

  function stopAutoFire() {
    if (autoFireTimer) {
      clearInterval(autoFireTimer);
      autoFireTimer = null;
    }
  }

  function onFireDown(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!enabled || gameOver) return;
    ensureAudio();
    loadAllSounds();
    firing = true;
    startAutoFire();
  }

  function onFireUp(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    firing = false;
    stopAutoFire();
  }

  function update(now) {
    if (respawnAt && now >= respawnAt) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const x = THREE.MathUtils.randFloat(-7, 7);
        const z = THREE.MathUtils.randFloat(-11, 2);
        const distance = Math.hypot(
          x - world.camera.position.x, z - world.camera.position.z
        );
        const blocked = world.obstacles.some(function(o) {
          return x > o.minX - 0.8 && x < o.maxX + 0.8 &&
                 z > o.minZ - 0.8 && z < o.maxZ + 0.8;
        });
        if (blocked || distance <= 2.5) continue;
        world.target.position.set(x, 1.4, z);
        world.target.visible = true;
        crosshair.classList.remove('hit');
        respawnAt = 0;
        break;
      }
    }
  }

  button.addEventListener('pointerdown', onFireDown);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function(name) {
    button.addEventListener(name, onFireUp);
  });

  clearStatus();

  const canvas = world.renderer.domElement;
  const initAudioOnce = function() {
    ensureAudio();
    loadAllSounds();
    canvas.removeEventListener('pointerdown', initAudioOnce);
  };
  canvas.addEventListener('pointerdown', initAudioOnce, { once: true });

  return {
    update,
    updateEffects: updateEffects,
    setEnabled: function(value) {
      enabled = value;
      if (!value) { firing = false; stopAutoFire(); }
    },
    dispose: function() {
      enabled = false;
      firing = false;
      stopAutoFire();
      impacts.forEach(function(im) {
        world.scene.remove(im.mesh);
        im.mesh.geometry.dispose();
        im.mesh.material.dispose();
      });
      impacts.length = 0;
      button.removeEventListener('pointerdown', onFireDown);
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function(name) {
        button.removeEventListener(name, onFireUp);
      });
      crosshair.classList.remove('hit');
      crosshair.classList.remove('ads');
    }
  };
}
`;
