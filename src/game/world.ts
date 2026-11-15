export const worldScript = String.raw`
function createWorld(THREE, config) {
  const scene = new THREE.Scene();

  // ===== تنظیمات مپ =====
  const MAP_CONFIGS = {
    desert: {
      bg: '#d9b382',
      fog: '#d9b382',
      groundColor: '#d4a76a',
      groundSpot: '#c49a5e',
      brickA: '#b08045',
      brickB: '#a07840',
      sunColor: 0xfff5e0,
      hemiSky: 0xffe8c0,
      hemiGround: 0xa08050,
      gridColor: 0x8a6a3a
    },
    urban: {
      bg: '#5a6a7a',
      fog: '#5a6a7a',
      groundColor: '#6a6a70',
      groundSpot: '#5a5a60',
      brickA: '#7a7a80',
      brickB: '#5a5a60',
      sunColor: 0xffffff,
      hemiSky: 0xc0d0e0,
      hemiGround: 0x505050,
      gridColor: 0x4a4a50
    },
    snow: {
      bg: '#dfeaf5',
      fog: '#dfeaf5',
      groundColor: '#e8f0f8',
      groundSpot: '#d0dce8',
      brickA: '#a0b0c0',
      brickB: '#90a0b0',
      sunColor: 0xffffff,
      hemiSky: 0xe0f0ff,
      hemiGround: 0x8090a0,
      gridColor: 0x90a0b0
    }
  };

  const currentMapName = (config.maps && config.maps.current) || 'desert';
  const MAP = MAP_CONFIGS[currentMapName] || MAP_CONFIGS.desert;

  scene.background = new THREE.Color(MAP.bg);
  scene.fog = new THREE.Fog(MAP.fog, 20, 55);

  const camera = new THREE.PerspectiveCamera(
    config.camera.fov, innerWidth / innerHeight, 0.1, 200
  );
  camera.position.set(0, config.player.eyeHeight, 6);
  camera.lookAt(0, 1.4, -4);
  camera.rotation.reorder('YXZ');

  const renderer = new THREE.WebGLRenderer({antialias: false});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, config.graphics.maxPixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(MAP.hemiSky, MAP.hemiGround, 1.0));
  const sun = new THREE.DirectionalLight(MAP.sunColor, 2.5);
  sun.position.set(18, 22, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const obstacles = [];
  const shootables = [];

  function makeSandTexture(baseColor) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = baseColor || '#d4a76a';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1500; i++) {
      const shade = 180 + Math.floor(Math.random() * 50);
      ctx.fillStyle = 'rgba(' + shade + ',' + (shade - 30) + ',' + (shade - 70) + ',0.35)';
      const size = Math.random() * 2 + 0.5;
      ctx.fillRect(Math.random() * 128, Math.random() * 128, size, size);
    }
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = 'rgba(150,120,80,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const y = Math.random() * 128;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(40, y + 6, 80, y - 6, 128, y + 2);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12);
    return tex;
  }

  function makeBrickTexture(baseColor, mortarColor) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = mortarColor;
    ctx.fillRect(0, 0, 128, 128);
    const bw = 32, bh = 16;
    for (let row = 0; row < 8; row++) {
      const offset = (row % 2) * (bw / 2);
      for (let col = -1; col < 5; col++) {
        const x = col * bw + offset + 2;
        const y = row * bh + 2;
        const variation = Math.floor(Math.random() * 20) - 10;
        const col2 = adjustColor(baseColor, variation);
        ctx.fillStyle = col2;
        ctx.fillRect(x, y, bw - 3, bh - 3);
      }
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.08) + ')';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  const sandTex = makeSandTexture(MAP.groundColor);
  const brickTexA = makeBrickTexture(MAP.brickA, '#8a6535');
  const brickTexB = makeBrickTexture(MAP.brickB, '#7a5830');

  function box(w, h, d, color, x, y, z, solid, tex) {
    const mat = new THREE.MeshStandardMaterial({
      color: color, roughness: 0.95, metalness: 0.0
    });
    if (tex) {
      const t = tex.clone();
      t.needsUpdate = true;
      t.repeat.set(Math.max(1, w / 2), Math.max(1, h / 2));
      mat.map = t;
      mat.color.set('#ffffff');
    }
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    shootables.push(mesh);
    if (solid) {
      obstacles.push({
        minX: x - w / 2, maxX: x + w / 2,
        minZ: z - d / 2, maxZ: z + d / 2,
        minY: y - h / 2, maxY: y + h / 2
      });
    }
    return mesh;
  }

  // ===== زمین =====
  const groundMat = new THREE.MeshStandardMaterial({
    map: sandTex, roughness: 1.0, color: '#ffffff'
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  shootables.push(ground);

  box(8, 0.02, 6, MAP.groundSpot, -6, 0.01, -4, false);
  box(6, 0.02, 8, MAP.groundSpot, 7, 0.01, 3, false);

  // ===== دیوارهای مرزی =====
  box(60, 4, 0.5, MAP.brickA, 0, 2, -30, false, brickTexA);
  box(60, 4, 0.5, MAP.brickA, 0, 2, 30, false, brickTexA);
  box(0.5, 4, 60, MAP.brickA, -30, 2, 0, false, brickTexA);
  box(0.5, 4, 60, MAP.brickA, 30, 2, 0, false, brickTexA);

  // ===== سنگرها =====
  box(6, 1.4, 1, MAP.brickA, -12, 0.7, -8, true, brickTexA);
  box(1, 1.4, 5, MAP.brickA, -14.5, 0.7, -6, true, brickTexA);

  box(1, 1.6, 4, MAP.brickB, 12, 0.8, -8, true, brickTexB);
  box(4, 1.6, 1, MAP.brickB, 14.5, 0.8, -6, true, brickTexB);
  box(1, 1.6, 4, MAP.brickB, 12, 0.8, -2, true, brickTexB);

  box(3, 2, 3, MAP.brickB, 0, 1, -15, true, brickTexB);
  box(2, 1.2, 2, MAP.brickB, 3, 0.6, -15, true, brickTexB);
  box(2, 1.2, 2, MAP.brickB, -3, 0.6, -15, true, brickTexB);

  box(5, 1.8, 2, MAP.brickA, 20, 0.9, 5, true, brickTexA);
  box(2, 1.8, 5, MAP.brickA, 22, 0.9, 8, true, brickTexA);

  box(2, 1.5, 5, MAP.brickB, -20, 0.75, 5, true, brickTexB);
  box(5, 1.5, 2, MAP.brickB, -18, 0.75, 8, true, brickTexB);

  // ===== بشکه‌ها =====
  function barrel(x, z) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.2, 10),
      new THREE.MeshStandardMaterial({color: '#7a3f1a', roughness: 0.85})
    );
    mesh.position.set(x, 0.6, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    shootables.push(mesh);
    obstacles.push({
      minX: x - 0.5, maxX: x + 0.5,
      minZ: z - 0.5, maxZ: z + 0.5,
      minY: 0, maxY: 1.2
    });
  }
  barrel(-6, 0);
  barrel(-6, 1.5);
  barrel(6, -2);
  barrel(8, 12);

  // ===== صخره‌ها =====
  box(1.5, 1, 1.5, '#9a7a4a', -8, 0.5, 12, true);
  box(1, 0.8, 1, '#8a6a3a', 15, 0.4, 15, true);
  box(2, 1.2, 1.5, '#9a7a4a', -15, 0.6, 15, true);

  // ===== بیلبورد =====
  function makeCamoTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#a08050';
    ctx.fillRect(0, 0, 128, 128);
    const camoColors = ['#8a6a3a', '#b89a6a', '#6a5030', '#c4a878', '#5a4428'];
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = camoColors[Math.floor(Math.random() * camoColors.length)];
      ctx.beginPath();
      const cx = Math.random() * 128;
      const cy = Math.random() * 128;
      const r = 6 + Math.random() * 16;
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        const rad = r * (0.6 + Math.random() * 0.6);
        const px = cx + Math.cos(angle) * rad;
        const py = cy + Math.sin(angle) * rad;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.06) + ')';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function makeMilitarySignTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#7a6244';
    ctx.fillRect(0, 0, 512, 256);

    const camoColors = ['#6a5030', '#8a7050', '#5a4428', '#9a8060', '#4a3820'];
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = camoColors[Math.floor(Math.random() * camoColors.length)];
      ctx.beginPath();
      const cx = Math.random() * 512;
      const cy = Math.random() * 256;
      const r = 15 + Math.random() * 35;
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        const rad = r * (0.6 + Math.random() * 0.6);
        const px = cx + Math.cos(angle) * rad;
        const py = cy + Math.sin(angle) * rad;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(40,25,10,0.8)';
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.fillText('LIFE LANDS', 258, 92);
    ctx.fillStyle = '#e8dcc0';
    ctx.fillText('LIFE LANDS', 256, 90);

    ctx.strokeStyle = '#c4a878';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 130);
    ctx.lineTo(392, 130);
    ctx.stroke();

    ctx.fillStyle = 'rgba(40,25,10,0.8)';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText('www.lifelands.ir', 258, 176);
    ctx.fillStyle = '#d8c8a0';
    ctx.fillText('www.lifelands.ir', 256, 174);

    ctx.fillStyle = '#c4a878';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('★', 60, 90);
    ctx.fillText('★', 452, 90);

    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.12) + ')';
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
    }
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = 'rgba(40,25,10,' + (0.1 + Math.random() * 0.15) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const y = Math.random() * 256;
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  function makeMetalTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4a4438';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 300; i++) {
      const v = 40 + Math.floor(Math.random() * 40);
      ctx.fillStyle = 'rgba(' + v + ',' + (v - 5) + ',' + (v - 15) + ',0.5)';
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
    }
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = 'rgba(110,70,40,0.3)';
      ctx.beginPath();
      ctx.arc(Math.random() * 64, Math.random() * 64, 3 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  const signTex = makeMilitarySignTexture();
  const camoTex = makeCamoTexture();
  const metalTex = makeMetalTexture();

  const postMat = new THREE.MeshStandardMaterial({
    map: metalTex, color: '#6a5a40',
    roughness: 0.75, metalness: 0.6
  });
  [-2.3, 2.3].forEach(function(px) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 5.2, 10),
      postMat
    );
    post.position.set(px, 2.6, 0);
    post.castShadow = true;
    scene.add(post);
    shootables.push(post);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.25, 10),
      postMat
    );
    base.position.set(px, 0.12, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    shootables.push(base);
  });

  const frameMat = new THREE.MeshStandardMaterial({
    map: camoTex, color: '#8a7050',
    roughness: 0.8, metalness: 0.3
  });
  const frameBack = new THREE.Mesh(
    new THREE.BoxGeometry(5.9, 3.1, 0.18),
    frameMat
  );
  frameBack.position.set(0, 4.0, -0.12);
  frameBack.castShadow = true;
  scene.add(frameBack);
  shootables.push(frameBack);

  const frameEdges = [
    [6.1, 0.22, 0.32, 0, 5.6, 0],
    [6.1, 0.22, 0.32, 0, 2.4, 0],
    [0.22, 3.2, 0.32, -2.95, 4.0, 0],
    [0.22, 3.2, 0.32, 2.95, 4.0, 0]
  ];
  frameEdges.forEach(function(e) {
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(e[0], e[1], e[2]),
      frameMat
    );
    edge.position.set(e[3], e[4], e[5]);
    edge.castShadow = true;
    scene.add(edge);
    shootables.push(edge);
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: '#7a6a50', roughness: 0.7, metalness: 0.7
  });
  [[-2.85, 5.45], [2.85, 5.45], [-2.85, 2.55], [2.85, 2.55]].forEach(function(p) {
    const screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.06, 6),
      screwMat
    );
    screw.rotation.x = Math.PI / 2;
    screw.position.set(p[0], p[1], 0.18);
    scene.add(screw);
    shootables.push(screw);
  });

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 2.85, 0.12),
    [
      new THREE.MeshStandardMaterial({color: '#5a4a30', roughness: 0.85}),
      new THREE.MeshStandardMaterial({color: '#5a4a30', roughness: 0.85}),
      new THREE.MeshStandardMaterial({color: '#5a4a30', roughness: 0.85}),
      new THREE.MeshStandardMaterial({color: '#5a4a30', roughness: 0.85}),
      new THREE.MeshStandardMaterial({
        map: signTex,
        roughness: 0.8,
        metalness: 0.15
      }),
      new THREE.MeshStandardMaterial({color: '#5a4a30', roughness: 0.85})
    ]
  );
  signBoard.position.set(0, 4.0, 0.06);
  signBoard.castShadow = true;
  scene.add(signBoard);
  shootables.push(signBoard);

  const signLight = new THREE.PointLight(0xffe8c0, 0.6, 6, 2);
  signLight.position.set(0, 4.0, 1.2);
  scene.add(signLight);

  // ===== هدف تیراندازی =====
  const target = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16),
    new THREE.MeshStandardMaterial({color: '#ff4949', roughness: 0.6})
  );
  target.position.set(0, 1.4, -20);
  target.rotation.x = Math.PI / 2;
  target.castShadow = true;
  scene.add(target);
  shootables.push(target);
  // ===== ===== ===== ===== ===== ===== ===== ===== =====
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
  // ===== دشمن‌ها =====
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

      // چک برخورد با بازیکن
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

  // ===== نخل‌ها =====
  function palm(x, z) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.35, 4.5, 8),
      new THREE.MeshStandardMaterial({color: '#6a4a2a', roughness: 1})
    );
    trunk.position.set(x, 2.25, z);
    trunk.castShadow = true;
    scene.add(trunk);
    shootables.push(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 2.2, 4),
        new THREE.MeshStandardMaterial({color: '#3a6a2a', roughness: 1})
      );
      const angle = (i / 6) * Math.PI * 2;
      leaf.position.set(x + Math.cos(angle) * 0.9, 4.8, z + Math.sin(angle) * 0.9);
      leaf.rotation.z = Math.PI / 3;
      leaf.rotation.y = angle;
      leaf.castShadow = true;
      scene.add(leaf);
      shootables.push(leaf);
    }
  }
  palm(-12, 18);
  palm(14, -20);
  palm(-22, -15);
  palm(22, 20);

  const grid = new THREE.GridHelper(60, 30, MAP.gridColor, 0x9a7a4a);
  grid.position.set(0, 0.02, 0);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  // ===== اسلحه =====
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
    recoilTime = 0.18;
    muzzleFlash.material.opacity = 1;
    muzzleLight.intensity = 4;
    shakeIntensity = Math.min(shakeIntensity + 0.02, 0.04); // ✅ shake هم کم شد

    // ✅ recoil دوربین خیلی کم (به حداقل)
    const strength = config.weapon.recoilStrength || 0.004;
    cameraRecoilX += strength * (0.5 + Math.random() * 0.3); // ✅ ضریب کمتر
    cameraRecoilY += (Math.random() - 0.5) * strength * 0.15; // ✅ خیلی کم
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

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  function dispose() {
    scene.traverse(function(object) {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material)
          ? object.material : [object.material];
        materials.forEach(function(material) {
          if (material.map) material.map.dispose();
          if (material.emissiveMap) material.emissiveMap.dispose();
          material.dispose();
        });
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  }

  return {
    scene, camera, renderer, obstacles, shootables, target,
    bounds: {minX: -28, maxX: 28, minZ: -28, maxZ: 28},
    resize, dispose,
    gun: {
      group: gunGroup,
      triggerRecoil,
      updateGun,
      setAiming,
      getAdsProgress,
      getShake,
      decayShake,
      updateCameraRecoil
    },
    enemies,
    updateEnemies,
    updateEnemyProjectiles,
    hitEnemyEffect
  };
}
`;
