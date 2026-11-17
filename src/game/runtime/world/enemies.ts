/** Source fragment: assembled in order; shares its parent factory scope. */
export const enemies = String.raw`  // ===== دشمن‌ها =====
  const enemies = [];
  const enemyProjectiles = [];

  const enemyBodyMat = new THREE.MeshStandardMaterial({
    color: 0x8a3a2a, roughness: 0.85
  });
  const enemyHeadMat = new THREE.MeshStandardMaterial({
    color: 0xc08860, roughness: 0.7
  });
  const enemyHelmetMat = new THREE.MeshStandardMaterial({
    color: 0x3a4a2a, roughness: 0.8
  });
  const enemyLegMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, roughness: 0.9
  });
  const enemyGunMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30, roughness: 0.55, metalness: 0.85
  });
  const enemyGunDarkMat = new THREE.MeshStandardMaterial({
    color: 0x15151a, roughness: 0.7, metalness: 0.6
  });

  function createEnemy(x, z) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.7, 4, 8),
      enemyBodyMat
    );
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      enemyHeadMat
    );
    head.position.y = 1.6;
    head.castShadow = true;
    head.userData.isHead = true;  // ✅ برای headshot
    group.add(head);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      enemyHelmetMat
    );
    helmet.position.y = 1.65;
    group.add(helmet);

    const leftLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6),
      enemyLegMat
    );
    leftLeg.position.set(-0.15, 0.3, 0);
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6),
      enemyLegMat
    );
    rightLeg.position.set(0.15, 0.3, 0);
    group.add(rightLeg);

    const gunGroup = new THREE.Group();
    gunGroup.position.set(0.35, 1.0, 0.3);
    gunGroup.rotation.set(0, 0.2, 0);

    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.09, 0.32),
      enemyGunMat
    );
    gunGroup.add(gunBody);

    const gunBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.32, 6),
      enemyGunDarkMat
    );
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0.015, -0.26);
    gunGroup.add(gunBarrel);

    const gunMag = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.06),
      enemyGunDarkMat
    );
    gunMag.position.set(0, -0.1, 0.02);
    gunGroup.add(gunMag);

    group.add(gunGroup);

    group.position.set(x, 0, z);
    scene.add(group);

    const enemy = {
      group: group,
      leftLeg: leftLeg,
      rightLeg: rightLeg,
      gunGroup: gunGroup,
      x: x, z: z,
      targetX: x, targetZ: z,
      speed: 1.2 + Math.random() * 0.8,
      walkPhase: Math.random() * Math.PI * 2,
      nextMoveAt: 0,
      moveInterval: 800 + Math.random() * 1000,
      state: 'move',
      stateUntil: 0,
      hideSpot: null,
      nextShootAt: 0,
      shootCooldown: 1500 + Math.random() * 1500,
      burstMode: false,
      burstCount: 0,
      burstMax: 0,
      burstNextAt: 0,
      alive: true,
      respawnAt: 0,
      health: 1,
      hitFlashUntil: 0
    };
    enemies.push(enemy);
    shootables.push(group);
    return enemy;
  }

  createEnemy(-6, -12);
  createEnemy(6, -12);
  createEnemy(0, -18);

  function lineBlockedByObstacle(from, to) {
    const samples = 15;
    for (let i = 1; i < samples; i++) {
      const t = i / samples;
      const px = from.x + (to.x - from.x) * t;
      const py = from.y + (to.y - from.y) * t;
      const pz = from.z + (to.z - from.z) * t;

      for (let j = 0; j < obstacles.length; j++) {
        const o = obstacles[j];
        if (py < o.maxY && py > o.minY &&
            px > o.minX && px < o.maxX &&
            pz > o.minZ && pz < o.maxZ) {
          return true;
        }
      }
    }
    return false;
  }

  function findHideSpot(enemy) {
    let best = null;
    let bestScore = -Infinity;

    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (o.maxY < 1.2) continue;

      const spots = [
        { x: o.minX - 1, z: (o.minZ + o.maxZ) / 2 },
        { x: o.maxX + 1, z: (o.minZ + o.maxZ) / 2 },
        { x: (o.minX + o.maxX) / 2, z: o.minZ - 1 },
        { x: (o.minX + o.maxX) / 2, z: o.maxZ + 1 }
      ];

      for (let j = 0; j < spots.length; j++) {
        const s = spots[j];
        const distToEnemy = Math.hypot(s.x - enemy.x, s.z - enemy.z);
        if (distToEnemy > 10) continue;

        const testToPlayer = new THREE.Vector3(s.x, 1.2, s.z);
        const playerPos = new THREE.Vector3(
          camera.position.x, 1.2, camera.position.z
        );

        if (lineBlockedByObstacle(testToPlayer, playerPos)) {
          const score = -distToEnemy;
          if (score > bestScore) {
            bestScore = score;
            best = s;
          }
        }
      }
    }
    return best;
  }

  // ===== شلیک دشمن (گلوله واقعی با سرعت) =====
  function enemyShootAtPlayer(enemy, isAuto) {
    if (!enemy.alive) return false;

    const from = new THREE.Vector3(
      enemy.x + (Math.random() - 0.5) * 0.3,
      1.2,
      enemy.z + (Math.random() - 0.5) * 0.3
    );
    const to = new THREE.Vector3(
      camera.position.x + (Math.random() - 0.5) * 0.6,
      camera.position.y - 0.1 + (Math.random() - 0.5) * 0.3,
      camera.position.z + (Math.random() - 0.5) * 0.6
    );

    if (lineBlockedByObstacle(from, to)) {
      return false;
    }

    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const bullet = new THREE.Mesh(geo, mat);
    bullet.position.copy(from);
    scene.add(bullet);

    // Trail نورانی
    const trailGeo = new THREE.CylinderGeometry(0.02, 0.01, 1.5, 4, 1);
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xff6666,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    const trail = new THREE.Mesh(trailGeo, trailMat);
    trail.position.copy(from);
    trail.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), dir
    );
    scene.add(trail);

    if (window.playEnemyShotSound) window.playEnemyShotSound(isAuto);

    enemyProjectiles.push({
      mesh: bullet,
      trail: trail,
      velocity: dir.clone().multiplyScalar(config.weapon.bulletSpeed || 60),
      life: 3,
      maxLife: 3
    });

    return true;
  }

  // ===== آپدیت دشمن‌ها =====
  function updateEnemies(delta, now) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];

      if (e.hitFlashUntil && now > e.hitFlashUntil) {
        e.group.traverse(function(obj) {
          if (obj.material && obj.material.emissive) {
            obj.material.emissive.setHex(0x000000);
            obj.material.emissiveIntensity = 0;
          }
        });
        e.hitFlashUntil = 0;
      }

      if (!e.alive) {
        if (now >= e.respawnAt) {
          let attempts = 0;
          while (attempts < 20) {
            const rx = THREE.MathUtils.randFloat(-20, 20);
            const rz = THREE.MathUtils.randFloat(-22, -5);
            const distToPlayer = Math.hypot(
              rx - camera.position.x, rz - camera.position.z
            );
            if (distToPlayer > 8) {
              e.x = rx; e.z = rz;
              e.targetX = rx; e.targetZ = rz;
              break;
            }
            attempts++;
          }
          e.alive = true;
          e.group.visible = true;
          e.health = 1;
          e.state = 'move';
          e.burstMode = false;
          e.burstCount = 0;
          e.nextMoveAt = now + 300;
          e.nextShootAt = now + 1000;
          e.group.position.set(e.x, 0, e.z);
        }
        continue;
      }

      if (now >= e.stateUntil && !e.burstMode) {
        if (Math.random() < 0.4) {
          const spot = findHideSpot(e);
          if (spot) {
            e.state = 'hide';
            e.targetX = spot.x;
            e.targetZ = spot.z;
            e.stateUntil = now + 1500 + Math.random() * 1000;
          } else {
            e.state = 'move';
            e.stateUntil = now + e.moveInterval;
          }
        } else {
          e.state = 'move';
          const angle = Math.random() * Math.PI * 2;
          const dist = 3 + Math.random() * 6;
          e.targetX = e.x + Math.cos(angle) * dist;
          e.targetZ = e.z + Math.sin(angle) * dist;
          e.targetX = Math.max(-25, Math.min(25, e.targetX));
          e.targetZ = Math.max(-25, Math.min(8, e.targetZ));
          e.stateUntil = now + e.moveInterval;
        }
      }

      const dx = e.targetX - e.x;
      const dz = e.targetZ - e.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.3) {
        const moveSpeed = e.state === 'hide' ? e.speed * 1.5 : e.speed;
        const step = Math.min(moveSpeed * delta, dist);
        e.x += (dx / dist) * step;
        e.z += (dz / dist) * step;
        e.group.position.set(e.x, 0, e.z);

        e.group.rotation.y = Math.atan2(dx, dz);

        e.walkPhase += delta * 14;
        const swing = Math.sin(e.walkPhase) * 0.6;
        e.leftLeg.rotation.x = swing;
        e.rightLeg.rotation.x = -swing;
      } else {
        e.leftLeg.rotation.x *= 0.9;
        e.rightLeg.rotation.x *= 0.9;

        const dirToPlayer = Math.atan2(
          camera.position.x - e.x,
          camera.position.z - e.z
        );
        e.group.rotation.y += (dirToPlayer - e.group.rotation.y) * Math.min(1, delta * 5);
      }

      // شلیک
      if (e.burstMode) {
        if (now >= e.burstNextAt && e.burstCount < e.burstMax) {
          enemyShootAtPlayer(e, true);
          e.burstCount++;
          e.burstNextAt = now + 130;
        }
        if (e.burstCount >= e.burstMax) {
          e.burstMode = false;
          e.nextShootAt = now + e.shootCooldown + Math.random() * 1000;
        }
      } else if (now >= e.nextShootAt && e.state !== 'hide') {
        if (Math.random() < 0.4) {
          e.burstMode = true;
          e.burstMax = 3 + Math.floor(Math.random() * 3);
          e.burstCount = 0;
          e.burstNextAt = now;
        } else {
          enemyShootAtPlayer(e, false);
          e.nextShootAt = now + e.shootCooldown + Math.random() * 1000;
        }
      }
    }
  }

  // ===== آپدیت گلوله‌های دشمن (حرکت واقعی + برخورد) =====
  function updateEnemyProjectiles(delta) {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      const p = enemyProjectiles[i];
      p.life -= delta;

      const step = p.velocity.clone().multiplyScalar(delta);
      p.mesh.position.add(step);

      if (p.trail) {
        p.trail.position.copy(p.mesh.position);
        p.trail.scale.y *= 0.95;
      }

      const distToPlayer = p.mesh.position.distanceTo(camera.position);
      if (distToPlayer < 0.5) {
        if (window.applyPlayerDamage) window.applyPlayerDamage(12);
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        if (p.trail) {
          scene.remove(p.trail);
          p.trail.geometry.dispose();
          p.trail.material.dispose();
        }
        enemyProjectiles.splice(i, 1);
        continue;
      }

      // چک برخورد با موانع
      let hitObstacle = false;
      for (let j = 0; j < obstacles.length; j++) {
        const o = obstacles[j];
        const pos = p.mesh.position;
        if (pos.y < o.maxY && pos.y > o.minY &&
            pos.x > o.minX && pos.x < o.maxX &&
            pos.z > o.minZ && pos.z < o.maxZ) {
          hitObstacle = true;
          break;
        }
      }

      if (hitObstacle || p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        if (p.trail) {
          scene.remove(p.trail);
          p.trail.geometry.dispose();
          p.trail.material.dispose();
        }
        enemyProjectiles.splice(i, 1);
      }
    }
  }

  function hitEnemyEffect(enemy) {
    enemy.group.traverse(function(obj) {
      if (obj.material && obj.material.emissive) {
        obj.material.emissive.setHex(0xff0000);
        obj.material.emissiveIntensity = 0.9;
      }
    });
    enemy.hitFlashUntil = performance.now() + 150;

    const origX = enemy.x;
    const origZ = enemy.z;
    let shakes = 0;
    const interval = setInterval(function() {
      enemy.group.position.x = origX + (Math.random() - 0.5) * 0.2;
      enemy.group.position.z = origZ + (Math.random() - 0.5) * 0.2;
      shakes++;
      if (shakes > 5) {
        clearInterval(interval);
        enemy.group.position.x = enemy.x;
        enemy.group.position.z = enemy.z;
      }
    }, 25);
  }

`;
