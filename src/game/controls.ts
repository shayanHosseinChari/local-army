export const controlsScript = String.raw`
function createControls(world, config) {
  const canvas = world.renderer.domElement;
  const joystick = document.getElementById('joystick');
  const stick = document.getElementById('stick');
  const adsButton = document.getElementById('adsButton');
  const fireButton = document.getElementById('fireButton');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const input = {x: 0, y: 0};
  const removers = [];
  let moveId = null;
  let aiming = false;

  // ✅ Multi-touch look pointers (شامل FIRE)
  const lookPointers = {};

  function listen(element, name, handler) {
    element.addEventListener(name, handler);
    removers.push(function() { element.removeEventListener(name, handler); });
  }
  function updateStick(event) {
    const rect = joystick.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    const limit = 38;
    const scale = distance > limit ? limit / distance : 1;
    const x = dx * scale;
    const y = dy * scale;
    stick.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    input.x = distance < 5 ? 0 : x / limit;
    input.y = distance < 5 ? 0 : y / limit;
  }
  function resetMovement() {
    const oldId = moveId;
    moveId = null;
    input.x = 0;
    input.y = 0;
    stick.style.transform = 'translate(0px,0px)';
    if (oldId !== null && joystick.hasPointerCapture(oldId)) {
      joystick.releasePointerCapture(oldId);
    }
  }
  function resetLook() {
    Object.keys(lookPointers).forEach(function(pid) {
      delete lookPointers[pid];
    });
  }

  function startAim(event) {
    event.preventDefault();
    event.stopPropagation();
    aiming = true;
    if (adsButton) adsButton.classList.add('active');
    if (world.gun && world.gun.setAiming) world.gun.setAiming(true);
  }
  function stopAim(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!aiming) return;
    aiming = false;
    if (adsButton) adsButton.classList.remove('active');
    if (world.gun && world.gun.setAiming) world.gun.setAiming(false);
  }
  function resetAim() { stopAim(null); }

  function reset() { resetMovement(); resetLook(); resetAim(); }

  // ===== Joystick (حرکت) =====
  listen(joystick, 'pointerdown', function(event) {
    if (moveId !== null) return;
    event.preventDefault();
    moveId = event.pointerId;
    joystick.setPointerCapture(moveId);
    updateStick(event);
  });
  listen(joystick, 'pointermove', function(event) {
    if (event.pointerId !== moveId) return;
    event.preventDefault();
    updateStick(event);
  });
  function stopMovement(event) {
    if (event.pointerId === moveId) resetMovement();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function(name) {
    listen(joystick, name, stopMovement);
  });

  // ===== Look (چرخوندن دوربین) — Multi-Touch روی document =====
  // ✅ FIRE هم trackpad میشه — کشیدن انگشت روش دوربین رو می‌چرخونه
  listen(document, 'pointerdown', function(event) {
    const target = event.target;
    // استثنا: ADS، joystick، play/pause، منوها
    if (target === adsButton || (adsButton && adsButton.contains(target))) return;
    if (target === joystick || (joystick && joystick.contains(target))) return;
    if (target === playPauseBtn || (playPauseBtn && playPauseBtn.contains(target))) return;
    if (target.closest && target.closest('#pauseMenu')) return;
    if (target.closest && target.closest('#gameOver')) return;
    if (target.closest && target.closest('#mapSelector')) return;

    // ✅ FIRE و canvas و بقیه → trackpad
    lookPointers[event.pointerId] = {
      x: event.clientX,
      y: event.clientY
    };
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(event.pointerId); } catch (e) {}
    }
  });

  listen(document, 'pointermove', function(event) {
    const p = lookPointers[event.pointerId];
    if (!p) return;
    event.preventDefault();

    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;

    const rotation = world.camera.rotation;
    const sens = config.camera.sensitivity * (1 - 0.4 * (world.gun ? world.gun.getAdsProgress() : 0));
    rotation.y -= dx * sens;
    rotation.x -= dy * sens;
    rotation.x = Math.max(-config.camera.maxPitch,
      Math.min(config.camera.maxPitch, rotation.x));

    p.x = event.clientX;
    p.y = event.clientY;
  });

  function stopLooking(event) {
    if (lookPointers[event.pointerId]) {
      delete lookPointers[event.pointerId];
      if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    }
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function(name) {
    listen(document, name, stopLooking);
  });

  // ===== ADS =====
  if (adsButton) {
    listen(adsButton, 'pointerdown', startAim);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function(name) {
      listen(adsButton, name, stopAim);
    });
  }

  // ===== Play/Pause =====
  const playPauseIcon = document.getElementById('playPauseIcon');
  const pauseMenu = document.getElementById('pauseMenu');
  const resumeBtn = document.getElementById('resumeButton');
  let isPaused = false;

  function setPaused(value) {
    isPaused = value;
    if (isPaused) {
      if (playPauseIcon) playPauseIcon.setAttribute('d', 'M8 5v14l11-7z');
      if (playPauseBtn) playPauseBtn.classList.add('paused');
      if (pauseMenu) pauseMenu.classList.add('show');
    } else {
      if (playPauseIcon) playPauseIcon.setAttribute('d', 'M6 4h4v16H6zM14 4h4v16h-4z');
      if (playPauseBtn) playPauseBtn.classList.remove('paused');
      if (pauseMenu) pauseMenu.classList.remove('show');
    }
    if (window.togglePause) window.togglePause(isPaused);
  }

  if (playPauseBtn) {
    listen(playPauseBtn, 'pointerdown', function(event) {
      event.preventDefault();
      event.stopPropagation();
      setPaused(!isPaused);
    });
  }

  if (resumeBtn) {
    listen(resumeBtn, 'pointerdown', function(event) {
      event.preventDefault();
      event.stopPropagation();
      setPaused(false);
    });
  }

  // ===== انتخاب مپ =====
  const mapOptions = document.querySelectorAll('.mapOption');
  mapOptions.forEach(function(btn) {
    listen(btn, 'pointerdown', function(event) {
      event.preventDefault();
      event.stopPropagation();
      const map = btn.getAttribute('data-map');
      mapOptions.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (window.switchMap) window.switchMap(map);
      setPaused(false);
    });
  });

  return {
    input, reset,
    dispose: function() {
      reset();
      removers.forEach(function(remove) { remove(); });
    }
  };
}
`;
