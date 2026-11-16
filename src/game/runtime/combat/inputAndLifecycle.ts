/** Source fragment: assembled in order; shares its parent factory scope. */
export const inputAndLifecycle = String.raw`  function startAutoFire() {
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

  // ✅ FIRE: بدون stopPropagation + ADS خودکار
  function onFireDown(event) {
    event.preventDefault();
    if (!enabled || gameOver) return;
    ensureAudio();
    loadAllSounds();
    firing = true;

    // ✅ ADS خودکار فعال
    if (world.gun && world.gun.setAiming) world.gun.setAiming(true);

    startAutoFire();
  }

  function onFireUp(event) {
    if (event) { event.preventDefault(); }
    firing = false;
    stopAutoFire();

    // ✅ ADS خودکار غیرفعال
    if (world.gun && world.gun.setAiming) world.gun.setAiming(false);
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
      if (!value) {
        firing = false;
        stopAutoFire();
        if (world.gun && world.gun.setAiming) world.gun.setAiming(false);
      }
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
