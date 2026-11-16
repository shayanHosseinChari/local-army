/** Source fragment: assembled in order; shares its parent factory scope. */
export const shooting = String.raw`  function fireOnce(isAuto) {
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

`;
