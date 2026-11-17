export const terrain = String.raw`  function makeSandTexture(baseColor) {
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

`;
