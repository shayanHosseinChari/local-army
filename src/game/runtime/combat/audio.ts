/** Source fragment: assembled in order; shares its parent factory scope. */
export const audio = String.raw`  // ===== صدا =====
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

`;
