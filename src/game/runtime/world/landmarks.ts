/** Source fragment: assembled in order; shares its parent factory scope. */
export const landmarks = String.raw`  // ===== ===== ===== ===== ===== ===== ===== ===== =====
  // نشانه‌های Life Lands در سرتاسر محیط
  // ===== ===== ===== ===== ===== ===== ===== ===== =====

  // تکسچر لوگو برای پرچم‌ها و بنرها
  function makeLogoTexture(bgColor, textColor, logoText) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');

    // پس‌زمینه
    ctx.fillStyle = bgColor || '#2a1a0a';
    ctx.fillRect(0, 0, 256, 128);

    // حاشیه طلایی
    ctx.strokeStyle = '#e8b84a';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 244, 116);

    // ستاره‌های تزئینی
    ctx.fillStyle = '#e8b84a';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', 20, 30);
    ctx.fillText('★', 236, 30);
    ctx.fillText('★', 20, 105);
    ctx.fillText('★', 236, 105);

    // متن اصلی
    ctx.fillStyle = textColor || '#e8dcc0';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(logoText || 'LIFE LANDS', 128, 55);

    // خط جداکننده
    ctx.strokeStyle = '#c4a878';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 80);
    ctx.lineTo(206, 80);
    ctx.stroke();

    // زیرنویس
    ctx.fillStyle = '#c4a878';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('EST. 2024', 128, 100);

    return new THREE.CanvasTexture(c);
  }

  const flagTex = makeLogoTexture('#2a1a0a', '#e8dcc0', 'LIFE LANDS');
  const bannerTex = makeLogoTexture('#3a2a1a', '#ffd700', 'LIFELANDS');

  // ===== ۱. پرچم‌های Life Lands روی سنگرها =====
  function createFlag(x, y, z, rotation) {
    const flagGroup = new THREE.Group();

    // میله پرچم
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6),
      new THREE.MeshStandardMaterial({color: '#3a2a1a', roughness: 0.7, metalness: 0.4})
    );
    pole.position.y = 1.25;
    pole.castShadow = true;
    flagGroup.add(pole);

    // پارچه پرچم (دو طرفه)
    const flagMat = new THREE.MeshStandardMaterial({
      map: flagTex,
      side: THREE.DoubleSide,
      roughness: 0.8
    });
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      flagMat
    );
    flag.position.set(0.8, 2.0, 0);
    flag.castShadow = true;
    flagGroup.add(flag);

    // توپ بالای میله
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshStandardMaterial({color: '#e8b84a', roughness: 0.4, metalness: 0.8})
    );
    ball.position.y = 2.5;
    flagGroup.add(ball);

    flagGroup.position.set(x, y, z);
    flagGroup.rotation.y = rotation || 0;
    scene.add(flagGroup);
    shootables.push(flagGroup);
    return flagGroup;
  }

  // پرچم روی سنگرها
  createFlag(-12, 1.4, -8, 0);
  createFlag(12, 1.6, -8, 0);
  createFlag(0, 2.0, -15, 0);
  createFlag(20, 1.8, 5, Math.PI / 4);
  createFlag(-20, 1.5, 5, -Math.PI / 4);

  // ===== ۲. بنرهای آویز روی دیوارها =====
  function createBanner(x, y, z, rotation) {
    const bannerGroup = new THREE.Group();

    // میله افقی
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6),
      new THREE.MeshStandardMaterial({color: '#3a2a1a', roughness: 0.7, metalness: 0.4})
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.y = 0.9;
    bannerGroup.add(rod);

    // پارچه بنر
    const bannerMat = new THREE.MeshStandardMaterial({
      map: bannerTex,
      side: THREE.DoubleSide,
      roughness: 0.85
    });
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.9),
      bannerMat
    );
    banner.position.y = 0.3;
    banner.castShadow = true;
    bannerGroup.add(banner);

    bannerGroup.position.set(x, y, z);
    bannerGroup.rotation.y = rotation || 0;
    scene.add(bannerGroup);
    shootables.push(bannerGroup);
    return bannerGroup;
  }

  // بنر روی دیوارهای مرزی
  createBanner(-15, 3.0, -29.5, 0);
  createBanner(15, 3.0, -29.5, 0);
  createBanner(-15, 3.0, 29.5, Math.PI);
  createBanner(15, 3.0, 29.5, Math.PI);
  createBanner(-29.5, 3.0, -10, Math.PI / 2);
  createBanner(-29.5, 3.0, 10, Math.PI / 2);
  createBanner(29.5, 3.0, -10, -Math.PI / 2);
  createBanner(29.5, 3.0, 10, -Math.PI / 2);

  // ===== ۳. جعبه‌های تسلیحاتی Life Lands =====
  function makeCrateTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    // چوب
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(0, 0, 128, 128);
    // خطوط چوب
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = 'rgba(40,25,10,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i * 13);
      ctx.lineTo(128, i * 13 + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }
    // حاشیه فلزی
    ctx.strokeStyle = '#4a4438';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 124);
    // لوگو وسط
    ctx.fillStyle = '#e8b84a';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LL', 64, 50);
    ctx.fillStyle = '#c4a878';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('SUPPLY', 64, 80);
    // نویز
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.2) + ')';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    return new THREE.CanvasTexture(c);
  }

  const crateTex = makeCrateTexture();

  function createCrate(x, z, rotation) {
    const mat = new THREE.MeshStandardMaterial({
      map: crateTex, roughness: 0.9, metalness: 0.1
    });
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.8, 1.0),
      mat
    );
    crate.position.set(x, 0.4, z);
    crate.rotation.y = rotation || 0;
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
    shootables.push(crate);
    obstacles.push({
      minX: x - 0.5, maxX: x + 0.5,
      minZ: z - 0.5, maxZ: z + 0.5,
      minY: 0, maxY: 0.8
    });
    return crate;
  }

  // جعبه‌ها در نقاط استراتژیک
  createCrate(-18, -12, 0.3);
  createCrate(18, -12, -0.4);
  createCrate(-10, 8, 0.2);
  createCrate(10, 8, -0.3);
  createCrate(-5, -22, 0.5);

  // ===== ۴. تابلوهای جهت‌نما با لوگو =====
  function createSignpost(x, z, rotation) {
    const signGroup = new THREE.Group();

    // میله
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8),
      new THREE.MeshStandardMaterial({color: '#5a3a1a', roughness: 0.9})
    );
    post.position.y = 1.1;
    post.castShadow = true;
    signGroup.add(post);

    // تخته تابلو
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 0.08),
      [
        new THREE.MeshStandardMaterial({color: '#2a1a0a', roughness: 0.8}),
        new THREE.MeshStandardMaterial({color: '#2a1a0a', roughness: 0.8}),
        new THREE.MeshStandardMaterial({color: '#2a1a0a', roughness: 0.8}),
        new THREE.MeshStandardMaterial({color: '#2a1a0a', roughness: 0.8}),
        new THREE.MeshStandardMaterial({map: flagTex, roughness: 0.7}),
        new THREE.MeshStandardMaterial({color: '#2a1a0a', roughness: 0.8})
      ]
    );
    board.position.y = 1.8;
    board.castShadow = true;
    signGroup.add(board);

    signGroup.position.set(x, 0, z);
    signGroup.rotation.y = rotation || 0;
    scene.add(signGroup);
    shootables.push(signGroup);
    return signGroup;
  }

  createSignpost(-8, 3, -Math.PI / 4);
  createSignpost(8, 3, Math.PI / 4);
  createSignpost(-8, -18, 0);
  createSignpost(8, -18, 0);

  // ===== ۵. نشان‌های کوچک روی زمین =====
  function createGroundMarker(x, z) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(232,184,74,0.8)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#2a1a0a';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LL', 32, 34);

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 16),
      mat
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(x, 0.03, z);
    scene.add(marker);
    return marker;
  }

  createGroundMarker(-15, 10);
  createGroundMarker(15, 10);
  createGroundMarker(-15, -20);
  createGroundMarker(15, -20);
  createGroundMarker(0, 5);
  createGroundMarker(0, -10);
    // ===== بیلبورد بزرگ Life Lands (iframe روی صفحه‌ش قرار می‌گیره) =====
  function createBigBillboard(x, z, rotation) {
    const billboardGroup = new THREE.Group();

    const postMat = new THREE.MeshStandardMaterial({
      color: '#3a3a40', roughness: 0.6, metalness: 0.85
    });

    [-2.5, 2.5].forEach(function(offsetX) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.25, 8, 12),
        postMat
      );
      post.position.set(offsetX, 4, 0);
      post.castShadow = true;
      billboardGroup.add(post);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.7, 0.4, 12),
        postMat
      );
      base.position.set(offsetX, 0.2, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      billboardGroup.add(base);
    });

    // قاب
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#1a1a1a', roughness: 0.5, metalness: 0.7
    });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 3.5, 0.3),
      frameMat
    );
    frame.position.set(0, 6.5, -0.1);
    frame.castShadow = true;
    billboardGroup.add(frame);

    // صفحه مشکی (iframe روش قرار می‌گیره)
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(6.0, 3.0),
      screenMat
    );
    screen.position.set(0, 6.5, 0.1);
    billboardGroup.add(screen);

    // نورها
    const neonLight1 = new THREE.PointLight(0x00d4ff, 2.0, 12, 2);
    neonLight1.position.set(-3, 6.5, 0.5);
    billboardGroup.add(neonLight1);

    const neonLight2 = new THREE.PointLight(0x00ff9d, 1.5, 10, 2);
    neonLight2.position.set(3, 6.5, 0.5);
    billboardGroup.add(neonLight2);

    billboardGroup.position.set(x, 0, z);
    billboardGroup.rotation.y = rotation || 0;
    scene.add(billboardGroup);
    shootables.push(billboardGroup);

    obstacles.push({
      minX: x - 3.5, maxX: x + 3.5,
      minZ: z - 0.5, maxZ: z + 0.5,
      minY: 0, maxY: 8.5
    });

    return billboardGroup;
  }

  const mainBillboard = createBigBillboard(0, -25, 0);

  // ✅ نقطه مرجع صفحه بیلبورد (برای iframe)
  const billboardScreen = {
    group: mainBillboard,
    localPos: new THREE.Vector3(0, 6.5, 0.1)
  };
`;
