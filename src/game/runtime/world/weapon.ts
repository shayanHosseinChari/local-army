/** Source fragment: assembled in order; shares its parent factory scope. */
export const weapon = String.raw`  // ===== اسلحه =====
  scene.add(camera);

  const gunGroup = new THREE.Group();
  gunGroup.position.set(0.32, -0.28, -0.55);
  gunGroup.rotation.set(0, 0.08, 0);
  camera.add(gunGroup);

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: '#2a2a30', roughness: 0.55, metalness: 0.85
  });
  const gunDarkMat = new THREE.MeshStandardMaterial({
    color: '#15151a', roughness: 0.7, metalness: 0.6
  });
  const gunGripMat = new THREE.MeshStandardMaterial({
    color: '#3a2a1a', roughness: 0.9, metalness: 0.1
  });
  const gunAccentMat = new THREE.MeshStandardMaterial({
    color: '#c9a04a', roughness: 0.4, metalness: 0.9,
    emissive: 0x3a2a00, emissiveIntensity: 0.3
  });

  const gunBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.11, 0.42),
    gunMetalMat
  );
  gunBody.position.set(0, 0, -0.05);
  gunGroup.add(gunBody);

  const gunBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.42, 8),
    gunDarkMat
  );
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 0.02, -0.32);
  gunGroup.add(gunBarrel);

  const gunMuzzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.026, 0.06, 8),
    gunDarkMat
  );
  gunMuzzle.rotation.x = Math.PI / 2;
  gunMuzzle.position.set(0, 0.02, -0.52);
  gunGroup.add(gunMuzzle);

  const gunMag = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.16, 0.08),
    gunDarkMat
  );
  gunMag.position.set(0, -0.12, 0.02);
  gunMag.rotation.x = -0.15;
  gunGroup.add(gunMag);

  const gunGrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.14, 0.07),
    gunGripMat
  );
  gunGrip.position.set(0, -0.11, 0.16);
  gunGrip.rotation.x = -0.3;
  gunGroup.add(gunGrip);

  const gunTrigger = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.006, 6, 12, Math.PI),
    gunDarkMat
  );
  gunTrigger.rotation.x = Math.PI / 2;
  gunTrigger.position.set(0, -0.06, 0.12);
  gunGroup.add(gunTrigger);

  const gunStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.02, 0.15),
    gunAccentMat
  );
  gunStripe.position.set(0.047, 0.01, -0.05);
  gunGroup.add(gunStripe);

  const gunScope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8),
    gunDarkMat
  );
  gunScope.rotation.x = Math.PI / 2;
  gunScope.position.set(0, 0.075, -0.02);
  gunGroup.add(gunScope);

  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  muzzleFlash.position.set(0, 0.02, -0.56);
  gunGroup.add(muzzleFlash);

  const muzzleLight = new THREE.PointLight(0xffaa33, 0, 3, 2);
  muzzleLight.position.set(0, 0.02, -0.56);
  gunGroup.add(muzzleLight);

  let recoilTime = 0;
  let walkPhase = 0;
  let adsProgress = 0;
  let aiming = false;

  let shakeIntensity = 0;
  let cameraRecoilX = 0;
  let cameraRecoilY = 0;
  const SHAKE_DECAY = 8;

  const baseGunPos = gunGroup.position.clone();
  const baseGunRot = gunGroup.rotation.clone();
  const adsGunPos = new THREE.Vector3(0, -0.13, -0.42);
  const adsGunRot = new THREE.Euler(0, 0, 0);

     function triggerRecoil() {
    recoilTime = 0.12;
    muzzleFlash.material.opacity = 1;
    muzzleLight.intensity = 3;
    shakeIntensity = Math.min(shakeIntensity + 0.01, 0.02);

    // ✅ recoil دوربین کاملاً حذف شد — اسلحه به بالا نمی‌ره
    // فقط یه لرزش خیلی کوچیک افقی (اختیاری)
    const strength = config.weapon.recoilStrength || 0.004;
    cameraRecoilX = 0;  // ← صفر (بدون حرکت عمودی)
    cameraRecoilY = (Math.random() - 0.5) * strength * 0.1;  // ← فقط افقی خیلی کم
  }

    function updateCameraRecoil(delta) {
    if (Math.abs(cameraRecoilX) < 0.0001 && Math.abs(cameraRecoilY) < 0.0001) return;

    camera.rotation.x += cameraRecoilX;
    camera.rotation.y += cameraRecoilY;

    // ✅ برگشت خیلی سریع‌تر (0.001 → 0.0000001)
    cameraRecoilX *= Math.pow(0.0000001, delta);
    cameraRecoilY *= Math.pow(0.0000001, delta);

    camera.rotation.x = Math.max(-config.camera.maxPitch,
      Math.min(config.camera.maxPitch, camera.rotation.x));
  }

  function setAiming(value) {
    aiming = value === true;
  }

  function getAdsProgress() {
    return adsProgress;
  }

  function getShake() {
    return shakeIntensity;
  }

  function decayShake(delta) {
    shakeIntensity = Math.max(0, shakeIntensity - SHAKE_DECAY * delta);
  }

  function updateGun(delta, moveInput) {
    const targetAds = aiming ? 1 : 0;
    adsProgress += (targetAds - adsProgress) * Math.min(1, delta * 12);
    if (Math.abs(adsProgress - targetAds) < 0.001) adsProgress = targetAds;

    const baseX = baseGunPos.x + (adsGunPos.x - baseGunPos.x) * adsProgress;
    const baseY = baseGunPos.y + (adsGunPos.y - baseGunPos.y) * adsProgress;
    const baseZ = baseGunPos.z + (adsGunPos.z - baseGunPos.z) * adsProgress;
    const rotX = baseGunRot.x + (adsGunRot.x - baseGunRot.x) * adsProgress;
    const rotY = baseGunRot.y + (adsGunRot.y - baseGunRot.y) * adsProgress;

    const moving = Math.abs(moveInput.x) > 0.05 || Math.abs(moveInput.y) > 0.05;
    if (moving) {
      walkPhase += delta * 9;
    } else {
      walkPhase *= 0.9;
    }
    const bobStrength = 1 - adsProgress * 0.7;
    const bobX = Math.cos(walkPhase) * 0.006 * (moving ? 1 : 0.3) * bobStrength;
    const bobY = Math.sin(walkPhase * 2) * 0.008 * (moving ? 1 : 0.3) * bobStrength;

    if (recoilTime > 0) {
      recoilTime = Math.max(0, recoilTime - delta);
      const t = recoilTime / 0.18;
      const kick = t * 0.08;
      gunGroup.position.z = baseZ + kick;
      gunGroup.rotation.x = rotX + t * 0.15;
      muzzleFlash.material.opacity = Math.max(0, t * 1.2);
      muzzleLight.intensity = t * 4;
    } else {
      gunGroup.position.z += (baseZ - gunGroup.position.z) * 0.2;
      gunGroup.rotation.x += (rotX - gunGroup.rotation.x) * 0.2;
      muzzleFlash.material.opacity = 0;
      muzzleLight.intensity = 0;
    }

    gunGroup.position.x = baseX + bobX;
    gunGroup.position.y = baseY + bobY;
    gunGroup.rotation.y = rotY;

    const targetFov = config.camera.fov - 15 * adsProgress;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  }

`;
