export const enemiesScript = String.raw`
function createEnemies(THREE, world, config, setStatus) {
  const cfg = config.enemy;
  const list = [];
  const raycaster = new THREE.Raycaster();
  const playerCenter = new THREE.Vector2(0, 0);

  // هندسه‌های مشترک
  const bodyGeo = new THREE.BoxGeometry(0.55, 0.9, 0.35);       // تنه
  const headGeo = new THREE.SphereGeometry(0.22, 8, 6);         // سر
  const legGeo  = new THREE.BoxGeometry(0.18, 0.85, 0.22);      // پا
  const armGeo  = new THREE.BoxGeometry(0.14, 0.7, 0.18);       // دست
  const gunGeo  = new THREE.BoxGeometry(0.07, 0.07, 0.6);       // اسلحه ساده

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.85, metalness: 0.1 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xcaa88a, roughness: 0.9, metalness: 0.0 });
  const legMat  = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.9, metalness: 0.05 });
  const gunMat  = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.5, metalness: 0.8 });

  // افکت خون/اصابت
  const sparkGeo = new THREE.SphereGeometry(0.06, 5, 4);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xff5a3a, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const MAX_SPARKS = 60;
  const sparkInst = new THREE.InstancedMesh(sparkGeo, sparkMat, MAX_SPARKS);
  sparkInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  sparkInst.frustumCulled = false;
  world.scene.add(sparkInst);
  const sparks = [];
  for (let i = 0; i < MAX_SPARKS; i++) {
    sparks.push({ active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0 });
  }
  function spawnSparks(pos, n) {
    for (let i = 0; i < n; i++) {
      const s = sparks.find(function(x) { return !x.active; });
      if (!s) return;
      s.active = true;
      s.pos.copy(pos);
      s.vel.set((Math.random()-0.5)*5, Math.random()*4, (Math.random()-0.5)*5);
      s.life = 0.35;
    }
  }

  // کمک‌کننده: آیا مسیر مستقیم بین a و b توسط مانع مسدود شده؟
  function isBlocked(ax, az, bx, bz, height) {
    const dx = bx - ax, dz = bz - az;
    const dist = Math.hypot(dx, dz);
    const steps = Math.ceil(dist / 0.5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = ax + dx * t;
      const z = az + dz * t;
      for (let j = 0; j < world.obstacles.length; j++) {
        const o = world.obstacles[j];
        if (o.height < height) continue;
        if (x > o.minX && x < o.maxX && z > o.minZ && z < o.maxZ) return true;
      }
    }
    return false;
  }

  // پیدا کردن نقطه اسپاون دور از بازیکن و موانع
  function pickSpawn() {
    const b = world.bounds;
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = THREE.MathUtils.randFloat(b.minX + 2, b.maxX - 2);
      const z = THREE.MathUtils.randFloat(b.minZ + 2, b.maxZ - 2);
      const dPlayer = Math.hypot(x - world.camera.position.x, z - world.camera.position.z);
      if (dPlayer < 12) continue;
      let blocked = false;
      for (let j = 0; j < world.obstacles.length; j++) {
        const o = world.obstacles[j];
        if (x > o.minX - 0.8 && x < o.maxX + 0.8 &&
            z > o.minZ - 0.8 && z < o.maxZ + 0.8) { blocked = true; break; }
      }
      if (blocked) continue;
      return { x, z };
    }
    return { x: 0, z: -25 };
  }

  // ساخت یک دشمن
  function createOne() {
    const root = new THREE.Group();
    const spawn = pickSpawn();
    root.position.set(spawn.x, 0, spawn.z);

    const torso = new THREE.Mesh(bodyGeo, bodyMat);
    torso.position.y = 1.05;
    torso.castShadow = true; torso.receiveShadow = true;
    root.add(torso);

    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.68;
    head.castShadow = true;
    root.add(head);

    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.14, 0.42, 0);
    legL.castShadow = true;
    root.add(legL);

    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.14, 0.42, 0);
    legR.castShadow = true;
    root.add(legR);

    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.36, 1.15, -0.05);
    armL.castShadow = true;
    root.add(armL);

    const armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0.36, 1.15, -0.05);
    armR.castShadow = true;
    root.add(armR);

    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.28, 1.15, -0.28);
    root.add(gun);

    // نشانگر دشمن (شعاع قرمز کوچک بالای سر — کمک به دیده شدن)
    const markerGeo = new THREE.SphereGeometry(0.08, 6, 5);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.y = 2.15;
    root.add(marker);

    world.scene.add(root);

    const enemy = {
      root, torso, head, marker,
      hp: cfg.maxHealth,
      maxHp: cfg.maxHealth,
      alive: true,
      lastFireAt: 0,
      state: 'idle',          // idle | chase | attack | dead
      respawnAt: 0,
      spawnX: spawn.x, spawnZ: spawn.z,
      walkPhase: Math.random() * Math.PI * 2,
    };
    return enemy;
  }

  // مقداردهی اولیه
  for (let i = 0; i < cfg.count; i++) list.push(createOne());

  // شلیک دشمن به بازیکن
  function enemyShoot(enemy, now) {
    const camPos = world.camera.position;
    // شانس اصابت (کاهش با فاصله)
    const dx = camPos.x - enemy.root.position.x;
    const dz = camPos.z - enemy.root.position.z;
    const dist = Math.hypot(dx, dz);
    const hitChance = Math.max(0.15, 0.75 - dist * 0.02);
    // افکت tracer از دشمن به بازیکن
    const from = new THREE.Vector3(
      enemy.root.position.x, 1.2, enemy.root.position.z
    );
    const to = new THREE.Vector3(
      camPos.x + (Math.random()-0.5) * 1.2,
      camPos.y + (Math.random()-0.5) * 0.8,
      camPos.z + (Math.random()-0.5) * 1.2
    );
    world.spawnTracer(from, to);

    if (Math.random() < hitChance) {
      // به combat آسیب می‌زنیم
      if (world.onPlayerDamage) world.onPlayerDamage(cfg.damage, enemy);
    }
  }

  // حرکت دشمن (chase → attack)
  function updateEnemy(enemy, dt, now) {
    if (!enemy.alive) return;
    const camPos = world.camera.position;
    const dx = camPos.x - enemy.root.position.x;
    const dz = camPos.z - enemy.root.position.z;
    const dist = Math.hypot(dx, dz);

    // چرخش به سمت بازیکن
    const targetYaw = Math.atan2(dx, dz);
    let dy = targetYaw - enemy.root.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    enemy.root.rotation.y += dy * Math.min(1, dt * 6);

    const blocked = isBlocked(
      enemy.root.position.x, enemy.root.position.z,
      camPos.x, camPos.z, 1.2
    );

    if (dist <= cfg.sightRange && !blocked) {
      if (dist <= cfg.fireRange) {
        enemy.state = 'attack';
        // توقف و شلیک
        if (now - enemy.lastFireAt >= cfg.fireCooldownMs) {
          enemy.lastFireAt = now;
          enemyShoot(enemy, now);
        }
      } else {
        enemy.state = 'chase';
        // حرکت به سمت بازیکن
        const nx = dx / dist, nz = dz / dist;
        const step = cfg.speed * dt;
        tryMove(enemy, nx * step, nz * step);
        enemy.walkPhase += dt * 8;
      }
    } else {
      enemy.state = 'idle';
    }

    // انیمیشن ساده پا (چرخش جزئی)
    const swing = enemy.state === 'chase' ? Math.sin(enemy.walkPhase) * 0.35 : 0;
    // (پاها با position شبیه‌سازی نمی‌کنیم برای سادگی؛ فقط سر تکان می‌خورد)
    enemy.head.position.y = 1.68 + (enemy.state === 'chase' ? Math.abs(Math.sin(enemy.walkPhase)) * 0.03 : 0);
  }

  // جابجایی با برخورد با موانع
  function tryMove(enemy, dx, dz) {
    const b = world.bounds;
    const r = 0.3;
    const pos = enemy.root.position;
    function ok(x, z) {
      if (x < b.minX + r || x > b.maxX - r || z < b.minZ + r || z > b.maxZ - r) return false;
      for (let j = 0; j < world.obstacles.length; j++) {
        const o = world.obstacles[j];
        if (x > o.minX - r && x < o.maxX + r && z > o.minZ - r && z < o.maxZ + r) return false;
      }
      return true;
    }
    if (ok(pos.x + dx, pos.z)) pos.x += dx;
    if (ok(pos.x, pos.z + dz)) pos.z += dz;
  }

  // اصابت به دشمن: از سمت combat صدا زده می‌شه
  function damageEnemy(enemy, amount, hitPoint) {
    if (!enemy.alive) return false;
    enemy.hp -= amount;
    if (hitPoint) spawnSparks(hitPoint, 6);
    if (enemy.hp <= 0) {
      enemy.alive = false;
      enemy.state = 'dead';
      enemy.respawnAt = performance.now() + cfg.respawnMs;
      // پنهان کردن
      enemy.root.visible = false;
      return true; // کشته شد
    }
    return false;
  }

  // پیدا کردن دشمن از mesh (برای raycast بازیکن)
  // می‌گردیم ببینیم کدوم دشمن این mesh رو داره
  function enemyFromObject(obj) {
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      if (obj === e.torso || obj === e.head || obj === e.root) return e;
    }
    return null;
  }

  // همه‌ی meshهای قابل شلیک دشمن‌ها (برای raycast)
  function getShootableParts() {
    const parts = [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      parts.push(e.torso, e.head);
    }
    return parts;
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < list.length; i++) if (list[i].alive) n++;
    return n;
  }

  // update کل سیستم
  const _dummy = new THREE.Object3D();
  function update(now, dt) {
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.alive) {
        updateEnemy(e, dt, now);
      } else if (now >= e.respawnAt) {
        // respawn: مکان جدید
        const spawn = pickSpawn();
        e.root.position.set(spawn.x, 0, spawn.z);
        e.hp = e.maxHp;
        e.alive = true;
        e.state = 'idle';
        e.root.visible = true;
      }
    }

    // sparks
    let si = 0;
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      if (!s.active) continue;
      s.life -= dt;
      s.vel.y -= 9 * dt;
      s.pos.addScaledVector(s.vel, dt);
      if (s.life <= 0) { s.active = false; continue; }
      _dummy.position.copy(s.pos);
      _dummy.scale.setScalar(Math.max(0.1, s.life * 2.2));
      _dummy.updateMatrix();
      sparkInst.setMatrixAt(si++, _dummy.matrix);
    }
    _dummy.scale.setScalar(0);
    _dummy.position.set(0, -9999, 0);
    _dummy.updateMatrix();
    for (let i = si; i < MAX_SPARKS; i++) sparkInst.setMatrixAt(i, _dummy.matrix);
    sparkInst.instanceMatrix.needsUpdate = true;
  }

  function dispose() {
    for (let i = 0; i < list.length; i++) {
      world.scene.remove(list[i].root);
    }
    bodyGeo.dispose(); headGeo.dispose(); legGeo.dispose();
    armGeo.dispose(); gunGeo.dispose(); sparkGeo.dispose();
    bodyMat.dispose(); headMat.dispose(); legMat.dispose();
    gunMat.dispose(); sparkMat.dispose();
    sparkInst.dispose();
  }

  return {
    update, damageEnemy, enemyFromObject, getShootableParts,
    aliveCount, dispose,
  };
}
`;
