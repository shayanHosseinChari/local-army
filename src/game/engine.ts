export const engineScript = String.raw`
function createEngine(world, controls, physics, combat, setStatus) {
  let frame = 0;
  let previousTime = performance.now();
  let disposed = false;
  let contextLost = false;
  let nativePaused = false;
  let userPaused = false;

  const siteIframeContainer = document.getElementById('siteIframeContainer');
  const siteIframe = document.getElementById('siteIframe');

  // ✅ محاسبه موقعیت iframe روی بیلبورد
  function updateIframePosition() {
    if (!siteIframeContainer || !siteIframe) return;
    if (!world.billboardScreen) return;

    const bs = world.billboardScreen;

    // موقعیت جهانی صفحه بیلبورد
    const worldPos = bs.localPos.clone();
    bs.group.localToWorld(worldPos);

    // جهت از دوربین به بیلبورد
    const camPos = world.camera.position;
    const dir = worldPos.clone().sub(camPos);
    const dist = dir.length();
    dir.normalize();

    // چک کن بیلبورد جلوی دوربینه؟
    const camDir = new THREE.Vector3();
    world.camera.getWorldDirection(camDir);
    const dot = camDir.dot(dir);

    // اگه پشت بازیکن یا خیلی دور بود، مخفی کن
    if (dot < 0.3 || dist > 45) {
      siteIframeContainer.classList.remove('active');
      return;
    }

    // نمایش
    siteIframeContainer.classList.add('active');

    // تبدیل موقعیت 3D به مختصات صفحه
    const projected = worldPos.clone();
    projected.project(world.camera);

    const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;

    // محاسبه اندازه بر اساس فاصله (perspective)
    const baseSize = 500;
    const scale = baseSize / (dist + 1);

    const width = Math.max(150, Math.min(900, 180 * scale));
    const height = width * 0.5; // نسبت 2:1

    // اعمال
    siteIframe.style.left = (screenX - width / 2) + 'px';
    siteIframe.style.top = (screenY - height / 2) + 'px';
    siteIframe.style.width = width + 'px';
    siteIframe.style.height = height + 'px';

    // شفافیت بر اساس فاصله (دورتر = محوتر)
    const opacity = Math.max(0.4, Math.min(1, 1.5 - dist / 30));
    siteIframe.style.opacity = opacity;
  }

  function paused() {
    return document.hidden || nativePaused || contextLost || userPaused;
  }

  function syncActivity() {
    cancelAnimationFrame(frame);
    frame = 0;
    controls.reset();
    combat.setEnabled(!paused());
    if (!disposed && !paused()) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  window.togglePause = function(value) {
    userPaused = value;
    syncActivity();
  };

  function tick(now) {
    frame = 0;
    if (disposed || paused()) return;
    try {
      const delta = Math.min(Math.max((now - previousTime) / 1000, 0), 0.05);
      previousTime = now;

      physics.move(controls.input, delta);
      combat.update(now);

      if (world.updateEnemies) world.updateEnemies(delta, now);
      if (world.updateEnemyProjectiles) world.updateEnemyProjectiles(delta);
      if (combat.updateEffects) combat.updateEffects(delta);
      if (world.gun && world.gun.updateGun) {
        world.gun.updateGun(delta, controls.input);
      }
      if (world.gun && world.gun.updateCameraRecoil) {
        world.gun.updateCameraRecoil(delta);
      }

      if (world.gun && world.gun.getShake) {
        const shake = world.gun.getShake();
        if (shake > 0.001) {
          world.camera.position.x += (Math.random() - 0.5) * shake;
          world.camera.position.y += (Math.random() - 0.5) * shake;
        }
        if (world.gun.decayShake) world.gun.decayShake(delta);
      }

      // ✅ آپدیت موقعیت iframe
      updateIframePosition();

      world.target.rotation.y += delta * 0.6;
      world.renderer.render(world.scene, world.camera);
      frame = requestAnimationFrame(tick);
    } catch (error) {
      combat.setEnabled(false);
      controls.reset();
      reportError(error);
    }
  }
  function onNativePause() { nativePaused = true; syncActivity(); }
  function onNativeResume() { nativePaused = false; syncActivity(); }
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    syncActivity();
    setStatus('Graphics paused. Waiting for context recovery...');
  }
  function onContextRestored() {
    contextLost = false;
    world.resize();
    syncActivity();
    setStatus('Graphics recovered. Score is retained.');
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', syncActivity);
    window.removeEventListener('nativePause', onNativePause);
    window.removeEventListener('nativeResume', onNativeResume);
    window.removeEventListener('resize', world.resize);
    window.removeEventListener('pagehide', dispose);
    world.renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
    world.renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
    controls.dispose();
    combat.dispose();
    world.dispose();
  }

  document.addEventListener('visibilitychange', syncActivity);
  window.addEventListener('nativePause', onNativePause);
  window.addEventListener('nativeResume', onNativeResume);
  window.addEventListener('resize', world.resize);
  window.addEventListener('pagehide', dispose);
  world.renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  world.renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  syncActivity();
  return {dispose};
}
`;
