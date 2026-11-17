/** Source fragment: assembled in order; shares its parent factory scope. */
export const weapon = String.raw`  // ===== اسلحه (نسخه واقع‌گرایانه — بدون تأثیر روی محیط) =====
  scene.add(camera);

  // ---------------------------------------------------------
  // 0) env map اختصاصی اسلحه (فقط روی متریال‌های اسلحه)
  //    ⚠️ scene.environment ست نمی‌شود → محیط دست‌نخورده می‌ماند
  // ---------------------------------------------------------
  let envTexture = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x1a1a22);

    const envSphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })
    );
    envScene.add(envSphere);

    const envBox = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshBasicMaterial({ color: 0xffddaa })
    );
    envBox.position.set(3, 4, 2);
    envScene.add(envBox);

    const envBox2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshBasicMaterial({ color: 0x88aaff })
    );
    envBox2.position.set(-4, 2, -3);
    envScene.add(envBox2);

    envTexture = pmrem.fromScene(envScene, 0.04).texture;
    pmrem.dispose();
  } catch (e) {
    console.warn('Env map skipped:', e);
  }

  // ---------------------------------------------------------
  // 1) گروه اسلحه
  // ---------------------------------------------------------
  const gunGroup = new THREE.Group();
  gunGroup.position.set(0.32, -0.28, -0.55);
  gunGroup.rotation.set(0, 0.08, 0);
  camera.add(gunGroup);

  // ---------------------------------------------------------
  // 2) متریال‌ها (envMap فقط روی اسلحه)
  // ---------------------------------------------------------
  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: '#2a2a30',
    roughness: 0.32,
    metalness: 0.95,
    envMap: envTexture,
    envMapIntensity: 1.2,
  });
  const gunDarkMat = new THREE.MeshStandardMaterial({
    color: '#15151a',
    roughness: 0.45,
    metalness: 0.88,
    envMap: envTexture,
    envMapIntensity: 1.0,
  });
  const gunPolymerMat = new THREE.MeshStandardMaterial({
    color: '#1c1c20',
    roughness: 0.85,
    metalness: 0.1,
    envMap: envTexture,
    envMapIntensity: 0.6,
  });
  const gunGripMat = new THREE.MeshStandardMaterial({
    color: '#2a1f15',
    roughness: 0.95,
    metalness: 0.05,
    envMap: envTexture,
    envMapIntensity: 0.4,
  });
  const gunAccentMat = new THREE.MeshStandardMaterial({
    color: '#c9a04a',
    roughness: 0.35,
    metalness: 0.95,
    emissive: 0x3a2a00,
    emissiveIntensity: 0.25,
    envMap: envTexture,
    envMapIntensity: 1.4,
  });
  const gunSteelMat = new THREE.MeshStandardMaterial({
    color: '#6a6a72',
    roughness: 0.25,
    metalness: 1.0,
    envMap: envTexture,
    envMapIntensity: 1.5,
  });

  // ---------------------------------------------------------
  // 3) بدنه اصلی (ExtrudeGeometry با پروفیل زاویه‌دار)
  // ---------------------------------------------------------
  function makeBodyProfile() {
    const s = new THREE.Shape();
    s.moveTo(-0.21, -0.055);
    s.lineTo( 0.21, -0.055);
    s.lineTo( 0.21,  0.015);
    s.lineTo( 0.14,  0.055);
    s.lineTo(-0.12,  0.055);
    s.lineTo(-0.18,  0.035);
    s.lineTo(-0.21,  0.010);
    s.closePath();
    return s;
  }

  const bodyGeo = new THREE.ExtrudeGeometry(makeBodyProfile(), {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 4,
  });
  bodyGeo.rotateY(Math.PI / 2);
  bodyGeo.translate(0, 0, -0.05);
  const gunBody = new THREE.Mesh(bodyGeo, gunMetalMat);
  gunGroup.add(gunBody);

  const receiverSplit = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.004, 0.40),
    gunDarkMat
  );
  receiverSplit.position.set(0, -0.005, -0.05);
  gunGroup.add(receiverSplit);

  // ---------------------------------------------------------
  // 4) ریل Picatinny
  // ---------------------------------------------------------
  const railBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.008, 0.30),
    gunDarkMat
  );
  railBase.position.set(0, 0.062, -0.10);
  gunGroup.add(railBase);

  const railToothGeo = new THREE.BoxGeometry(0.032, 0.006, 0.008);
  for (let i = 0; i < 15; i++) {
    const tooth = new THREE.Mesh(railToothGeo, gunMetalMat);
    tooth.position.set(0, 0.069, -0.245 + i * 0.0195);
    gunGroup.add(tooth);
  }

  // ---------------------------------------------------------
  // 5) لوله + handguard + muzzle brake
  // ---------------------------------------------------------
  const gunBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.40, 24),
    gunDarkMat
  );
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 0.02, -0.33);
  gunGroup.add(gunBarrel);

  const handguard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.26, 8),
    gunPolymerMat
  );
  handguard.rotation.x = Math.PI / 2;
  handguard.position.set(0, 0.02, -0.27);
  gunGroup.add(handguard);

  for (let i = 0; i < 6; i++) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.012, 0.012),
      gunDarkMat
    );
    vent.position.set(0, 0.02, -0.36 + i * 0.04);
    gunGroup.add(vent);
  }

  const gunMuzzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.028, 0.07, 16),
    gunSteelMat
  );
  gunMuzzle.rotation.x = Math.PI / 2;
  gunMuzzle.position.set(0, 0.02, -0.55);
  gunGroup.add(gunMuzzle);

  for (let i = 0; i < 3; i++) {
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.016, 0.008),
      gunDarkMat
    );
    slot.position.set(0, 0.02, -0.57 + i * 0.018);
    gunGroup.add(slot);
  }

  // ---------------------------------------------------------
  // 6) خشاب
  // ---------------------------------------------------------
  const magShape = new THREE.Shape();
  magShape.moveTo(-0.028, 0.00);
  magShape.lineTo( 0.028, 0.00);
  magShape.lineTo( 0.032, -0.18);
  magShape.lineTo(-0.024, -0.20);
  magShape.closePath();
  const magGeo = new THREE.ExtrudeGeometry(magShape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1,
  });
  magGeo.translate(0, 0, -0.035);
  const gunMag = new THREE.Mesh(magGeo, gunPolymerMat);
  gunMag.position.set(0, -0.055, 0.02);
  gunMag.rotation.x = -0.12;
  gunGroup.add(gunMag);

  for (let i = 0; i < 5; i++) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.072, 0.006, 0.01),
      gunDarkMat
    );
    rib.position.set(0, -0.075 - i * 0.028, 0.02);
    rib.rotation.x = -0.12;
    gunGroup.add(rib);
  }

  // ---------------------------------------------------------
  // 7) دسته
  // ---------------------------------------------------------
  const gripShape = new THREE.Shape();
  gripShape.moveTo(-0.028, 0.0);
  gripShape.lineTo( 0.028, 0.0);
  gripShape.lineTo( 0.032, -0.13);
  gripShape.lineTo(-0.030, -0.15);
  gripShape.closePath();
  const gripGeo = new THREE.ExtrudeGeometry(gripShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  gripGeo.translate(0, 0, -0.0275);
  const gunGrip = new THREE.Mesh(gripGeo, gunGripMat);
  gunGrip.position.set(0, -0.055, 0.155);
  gunGrip.rotation.x = -0.32;
  gunGroup.add(gunGrip);

  for (let i = 0; i < 3; i++) {
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.008, 0.006),
      gunDarkMat
    );
    groove.position.set(0, -0.09 - i * 0.028, 0.165);
    groove.rotation.x = -0.32;
    gunGroup.add(groove);
  }

  // ---------------------------------------------------------
  // 8) trigger guard + trigger
  // ---------------------------------------------------------
  const triggerGuard = new THREE.Mesh(
    new THREE.TorusGeometry(0.032, 0.005, 8, 16, Math.PI),
    gunDarkMat
  );
  triggerGuard.rotation.x = Math.PI / 2;
  triggerGuard.rotation.z = Math.PI;
  triggerGuard.position.set(0, -0.07, 0.11);
  gunGroup.add(triggerGuard);

  const gunTrigger = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.03, 0.008),
    gunSteelMat
  );
  gunTrigger.position.set(0, -0.065, 0.11);
  gunTrigger.rotation.x = 0.2;
  gunGroup.add(gunTrigger);

  // ---------------------------------------------------------
  // 9) سایت‌ها
  // ---------------------------------------------------------
  const rearSightBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.012, 0.02),
    gunDarkMat
  );
  rearSightBase.position.set(0, 0.08, 0.08);
  gunGroup.add(rearSightBase);

  const rearAperture = new THREE.Mesh(
    new THREE.TorusGeometry(0.006, 0.002, 6, 12),
    gunSteelMat
  );
  rearAperture.position.set(0, 0.092, 0.08);
  gunGroup.add(rearAperture);

  const frontSight = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.03, 0.008),
    gunDarkMat
  );
  frontSight.position.set(0, 0.075, -0.42);
  gunGroup.add(frontSight);

  const frontPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0015, 0.0015, 0.012, 6),
    gunAccentMat
  );
  frontPost.position.set(0, 0.09, -0.42);
  gunGroup.add(frontPost);

  // ---------------------------------------------------------
  // 10) جزئیات
  // ---------------------------------------------------------
  const screwGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.003, 8);
  const screwPositions = [
    [-0.044, 0.02, 0.12],
    [ 0.044, 0.02, 0.12],
    [-0.044, 0.02, -0.18],
    [ 0.044, 0.02, -0.18],
  ];
  screwPositions.forEach(([x, y, z]) => {
    const screw = new THREE.Mesh(screwGeo, gunSteelMat);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(x, y, z);
    gunGroup.add(screw);
  });

  const ejectionPort = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.025, 0.07),
    gunDarkMat
  );
  ejectionPort.position.set(0.047, 0.02, 0.02);
  gunGroup.add(ejectionPort);

  const gunStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.018, 0.14),
    gunAccentMat
  );
  gunStripe.position.set(0.047, 0.005, -0.08);
  gunGroup.add(gunStripe);

  // ---------------------------------------------------------
  // 11) muzzle flash + light
  // ---------------------------------------------------------
  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  muzzleFlash.position.set(0, 0.02, -0.60);
  gunGroup.add(muzzleFlash);

  const muzzleLight = new THREE.PointLight(0xffaa33, 0, 10, 2);
  muzzleLight.position.set(0, 0.02, -0.60);
  gunGroup.add(muzzleLight);

  // ---------------------------------------------------------
  // 12) وضعیت انیمیشن
  // ---------------------------------------------------------
  let walkPhase = 0;
  let adsProgress = 0;
  let aiming = false;

  let shakeIntensity = 0;
  let cameraRecoilX = 0;
  let cameraRecoilY = 0;
  const SHAKE_DECAY = 8;

  let recoilPos = 0;
  let recoilVel = 0;
  const RECOIL_STIFFNESS = 340;
  const RECOIL_DAMPING = 24;
  let muzzleFlashTimer = 0;

  let swayX = 0;
  let swayY = 0;

  const baseGunPos = gunGroup.position.clone();
  const baseGunRot = gunGroup.rotation.clone();
  const adsGunPos = new THREE.Vector3(0, -0.13, -0.42);
  const adsGunRot = new THREE.Euler(0, 0, 0);

  // ---------------------------------------------------------
  // 13) توابع
  // ---------------------------------------------------------
  function triggerRecoil() {
    recoilVel += 2.0;
    muzzleFlashTimer = 0.06;
    muzzleFlash.material.opacity = 1;
    muzzleLight.intensity = 6;
    shakeIntensity = Math.min(shakeIntensity + 0.012, 0.025);

    const strength = (config.weapon && config.weapon.recoilStrength) || 0.004;
    cameraRecoilX = 0;
    cameraRecoilY = (Math.random() - 0.5) * strength * 0.1;
  }

  function updateCameraRecoil(delta) {
    if (Math.abs(cameraRecoilX) < 0.0001 && Math.abs(cameraRecoilY) < 0.0001) return;
    camera.rotation.x += cameraRecoilX;
    camera.rotation.y += cameraRecoilY;
    cameraRecoilX *= Math.pow(0.0000001, delta);
    cameraRecoilY *= Math.pow(0.0000001, delta);
    camera.rotation.x = Math.max(
      -config.camera.maxPitch,
      Math.min(config.camera.maxPitch, camera.rotation.x)
    );
  }

  function setAiming(value) {
    aiming = value === true;
  }

  function getAdsProgress() { return adsProgress; }
  function getShake() { return shakeIntensity; }
  function decayShake(delta) {
    shakeIntensity = Math.max(0, shakeIntensity - SHAKE_DECAY * delta);
  }

  function addSway(dx, dy) {
    swayX += dx * 0.0004;
    swayY += dy * 0.0004;
    const maxSway = 0.03;
    swayX = Math.max(-maxSway, Math.min(maxSway, swayX));
    swayY = Math.max(-maxSway, Math.min(maxSway, swayY));
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
      walkPhase *= Math.pow(0.9, delta * 60);
    }
    const bobStrength = 1 - adsProgress;
    const bobX = Math.cos(walkPhase) * 0.006 * (moving ? 1 : 0.3) * bobStrength;
    const bobY = Math.sin(walkPhase * 2) * 0.008 * (moving ? 1 : 0.3) * bobStrength;

    const force = -RECOIL_STIFFNESS * recoilPos - RECOIL_DAMPING * recoilVel;
    recoilVel += force * delta;
    recoilPos += recoilVel * delta;

    if (muzzleFlashTimer > 0) {
      muzzleFlashTimer = Math.max(0, muzzleFlashTimer - delta);
      const t = muzzleFlashTimer / 0.06;
      muzzleFlash.material.opacity = t;
      muzzleLight.intensity = t * 6;
    } else {
      muzzleFlash.material.opacity = 0;
      muzzleLight.intensity = 0;
    }

    swayX *= Math.pow(0.001, delta);
    swayY *= Math.pow(0.001, delta);
    const swayFactor = 1 - adsProgress * 0.8;

    gunGroup.position.x = baseX + bobX;
    gunGroup.position.y = baseY + bobY;
    gunGroup.position.z = baseZ + recoilPos * 0.08;

    gunGroup.rotation.x = rotX - recoilPos * 0.12 + swayY * swayFactor;
    gunGroup.rotation.y = rotY + swayX * swayFactor;
    gunGroup.rotation.z = baseGunRot.z * (1 - adsProgress);

    const targetFov = config.camera.fov - 15 * adsProgress;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  }

`;
