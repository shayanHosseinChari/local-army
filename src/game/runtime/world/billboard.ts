/** Source fragment: assembled in order; shares its parent factory scope. */
export const billboard = String.raw`
  // ===== Resources =====
  const bbResources = {
    geometries: new Set(),
    materials: new Set(),
    textures: new Set()
  };

  let bbSeed = 91731;

  function bbRandom() {
    bbSeed = (
      Math.imul(bbSeed, 1664525) + 1013904223
    ) | 0;

    return (bbSeed >>> 0) / 4294967296;
  }

  function bbCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    return [canvas, canvas.getContext('2d')];
  }

  function bbTexture(canvas, isColor) {
    const texture = new THREE.CanvasTexture(canvas);

    if (isColor) {
      if (THREE.SRGBColorSpace !== undefined) {
        texture.colorSpace = THREE.SRGBColorSpace;
      } else if (THREE.sRGBEncoding !== undefined) {
        texture.encoding = THREE.sRGBEncoding;
      }
    }

    texture.anisotropy = 2;
    bbResources.textures.add(texture);

    return texture;
  }

  function bbGeometry(geometry) {
    bbResources.geometries.add(geometry);
    return geometry;
  }

  function bbMaterial(parameters) {
    const material = new THREE.MeshStandardMaterial(parameters);
    bbResources.materials.add(material);
    return material;
  }

  // ===== Weathered military sign =====
  function makeMilitarySignTexture() {
    const [canvas, ctx] = bbCanvas(1024, 512);

    ctx.fillStyle = '#686b51';
    ctx.fillRect(0, 0, 1024, 512);

    // Muted camouflage leaves the lettering readable.
    const palette = [
      '#62654c',
      '#73745a',
      '#565d46',
      '#7b7960'
    ];

    for (let i = 0; i < 58; i++) {
      const cx = bbRandom() * 1024;
      const cy = bbRandom() * 512;
      const radius = 25 + bbRandom() * 80;

      ctx.fillStyle =
        palette[Math.floor(bbRandom() * palette.length)];

      ctx.beginPath();

      for (let p = 0; p < 12; p++) {
        const angle = p / 12 * Math.PI * 2;
        const r = radius * (0.65 + bbRandom() * 0.45);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.65;

        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fill();
    }

    // Faded painted border.
    ctx.strokeStyle = '#b2ab86';
    ctx.lineWidth = 3;
    ctx.strokeRect(27, 27, 970, 458);

    ctx.strokeStyle = 'rgba(27,31,23,0.55)';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 1000, 488);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#c5bfa0';
    ctx.font = 'bold 23px "Courier New", monospace';
    ctx.fillText(
      'FIELD OPERATIONS / SECTOR 024',
      512,
      97
    );

    ctx.fillStyle = '#e1dac0';
    ctx.font = 'bold 106px Arial, sans-serif';
    ctx.fillText('LIFE LANDS', 512, 218, 880);

    ctx.fillStyle = '#b6b090';
    ctx.fillRect(178, 294, 668, 2);

    ctx.font = 'bold 42px "Courier New", monospace';
    ctx.fillText('www.lifelands.ir', 512, 354);

    ctx.fillStyle = '#aaa486';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText(
      'AUTHORIZED PERSONNEL ONLY',
      512,
      431
    );

    // Faded paint, pits and tiny exposed spots.
    for (let i = 0; i < 10000; i++) {
      const x = bbRandom() * 1024;
      const y = bbRandom() * 512;

      ctx.fillStyle = bbRandom() > 0.7
        ? 'rgba(219,209,171,0.10)'
        : 'rgba(31,34,25,0.16)';

      ctx.fillRect(
        x, y,
        0.5 + bbRandom() * 2.8,
        0.5 + bbRandom() * 1.5
      );
    }

    // Rust concentrated near edges, not uniformly over the text.
    for (let i = 0; i < 330; i++) {
      const edge = Math.floor(bbRandom() * 4);

      let x;
      let y;

      if (edge < 2) {
        x = bbRandom() * 1024;
        y = edge === 0
          ? bbRandom() * 18
          : 512 - bbRandom() * 25;
      } else {
        x = edge === 2
          ? bbRandom() * 18
          : 1024 - bbRandom() * 18;

        y = bbRandom() * 512;
      }

      ctx.fillStyle = 'rgba(92,53,29,0.55)';
      ctx.fillRect(
        x, y,
        1 + bbRandom() * 9,
        1 + bbRandom() * 5
      );
    }

    // Water streaks beneath attachment points.
    for (const x of [48, 976]) {
      for (let i = 0; i < 7; i++) {
        const streak = ctx.createLinearGradient(0, 40, 0, 180);

        streak.addColorStop(0, 'rgba(66,42,24,0.32)');
        streak.addColorStop(1, 'rgba(66,42,24,0)');

        ctx.fillStyle = streak;

        ctx.fillRect(
          x - 4 + bbRandom() * 8,
          40,
          1 + bbRandom() * 3,
          55 + bbRandom() * 90
        );
      }
    }

    const dirt = ctx.createLinearGradient(0, 0, 0, 512);
    dirt.addColorStop(0, 'rgba(0,0,0,0.10)');
    dirt.addColorStop(0.45, 'rgba(0,0,0,0)');
    dirt.addColorStop(1, 'rgba(37,28,17,0.22)');

    ctx.fillStyle = dirt;
    ctx.fillRect(0, 0, 1024, 512);

    return bbTexture(canvas, true);
  }

  // ===== Painted metal with separate roughness/height data =====
  function makeMetalTexture() {
    const [canvas, ctx] = bbCanvas(256, 256);
    const [roughCanvas, roughCtx] = bbCanvas(256, 256);
    const [heightCanvas, heightCtx] = bbCanvas(256, 256);

    ctx.fillStyle = '#63685d';
    ctx.fillRect(0, 0, 256, 256);

    roughCtx.fillStyle = '#b5b5b5';
    roughCtx.fillRect(0, 0, 256, 256);

    heightCtx.fillStyle = '#888';
    heightCtx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 190; i++) {
      const x = bbRandom() * 256;
      const y = bbRandom() * 256;
      const radius = 0.5 + bbRandom() * 5;

      ctx.fillStyle = bbRandom() > 0.5
        ? 'rgba(105,63,35,0.65)'
        : 'rgba(51,43,30,0.45)';

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      roughCtx.fillStyle = '#ededed';
      roughCtx.beginPath();
      roughCtx.arc(x, y, radius, 0, Math.PI * 2);
      roughCtx.fill();

      heightCtx.fillStyle = '#666';
      heightCtx.beginPath();
      heightCtx.arc(x, y, radius, 0, Math.PI * 2);
      heightCtx.fill();
    }

    for (let i = 0; i < 1800; i++) {
      const x = bbRandom() * 256;
      const y = bbRandom() * 256;

      ctx.fillStyle = bbRandom() > 0.5
        ? 'rgba(205,205,175,0.1)'
        : 'rgba(20,25,19,0.12)';

      ctx.fillRect(x, y, 1, 1 + bbRandom() * 4);
    }

    const texture = bbTexture(canvas, true);

    texture.userData.bbRoughness = bbTexture(
      roughCanvas,
      false
    );

    texture.userData.bbHeight = bbTexture(
      heightCanvas,
      false
    );

    return texture;
  }

  const signTex = makeMilitarySignTexture();
  const metalTex = makeMetalTexture();

  const postMat = bbMaterial({
    map: metalTex,
    roughnessMap: metalTex.userData.bbRoughness,
    bumpMap: metalTex.userData.bbHeight,
    bumpScale: 0.008,
    color: '#ffffff',
    roughness: 0.92,
    metalness: 0.35
  });

  const frameMat = postMat;

  const screwMat = bbMaterial({
    color: '#8b8d7f',
    roughness: 0.63,
    metalness: 0.75
  });

  const bbConcreteMat = bbMaterial({
    color: '#8c8778',
    roughness: 1,
    metalness: 0,
    bumpMap: metalTex.userData.bbHeight,
    bumpScale: 0.012
  });

  const bbSignMat = bbMaterial({
    map: signTex,
    color: '#ffffff',
    roughness: 0.9,
    metalness: 0.08
  });

  const bbBox = bbGeometry(
    new THREE.BoxGeometry(1, 1, 1)
  );

  const bbCylinder = bbGeometry(
    new THREE.CylinderGeometry(1, 1, 1, 12)
  );

  const bbBolt = bbGeometry(
    new THREE.CylinderGeometry(1, 1, 1, 6)
  );

  const billboardGroup = new THREE.Group();

  function bbPart(
    geometry, material,
    x, y, z,
    sx, sy, sz,
    rotationX, rotationZ
  ) {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.x = rotationX || 0;
    mesh.rotation.z = rotationZ || 0;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    billboardGroup.add(mesh);

    return mesh;
  }

  // ===== Structural supports =====
  for (const px of [-2.3, 2.3]) {
    bbPart(
      bbCylinder, postMat,
      px, 2.65, -0.10,
      0.15, 5.3, 0.15
    );

    bbPart(
      bbBox, bbConcreteMat,
      px, 0.18, -0.10,
      0.85, 0.36, 0.8
    );

    bbPart(
      bbBox, postMat,
      px, 0.38, -0.10,
      0.56, 0.05, 0.52
    );

    for (const dx of [-0.19, 0.19]) {
      for (const dz of [-0.17, 0.17]) {
        bbPart(
          bbBolt, screwMat,
          px + dx, 0.43, -0.10 + dz,
          0.032, 0.065, 0.032
        );
      }
    }
  }

  // Backing panel.
  const frameBack = bbPart(
    bbBox, frameMat,
    0, 4, -0.12,
    5.9, 3.1, 0.18
  );

  // Raised frame around the printed panel.
  const bbFrameEdges = [
    [6.1, 0.20, 0.32, 0, 5.52, 0],
    [6.1, 0.20, 0.32, 0, 2.48, 0],
    [0.20, 3.05, 0.32, -2.95, 4, 0],
    [0.20, 3.05, 0.32, 2.95, 4, 0]
  ];

  for (const edge of bbFrameEdges) {
    bbPart(
      bbBox, frameMat,
      edge[3], edge[4], edge[5],
      edge[0], edge[1], edge[2]
    );
  }

  // Back rails and diagonal braces.
  for (const y of [2.8, 5.2]) {
    bbPart(
      bbBox, postMat,
      0, y, -0.30,
      5.45, 0.10, 0.12
    );
  }

  for (const direction of [-1, 1]) {
    bbPart(
      bbBox, postMat,
      direction * 1.32, 4, -0.33,
      0.075, 3.48, 0.08,
      0,
      direction * 0.77
    );
  }

  // Actual hexagonal fasteners.
  for (const x of [-2.79, 2.79]) {
    for (const y of [2.64, 5.36]) {
      bbPart(
        bbBolt, screwMat,
        x, y, 0.19,
        0.045, 0.035, 0.045,
        Math.PI / 2
      );
    }
  }

  // Front print: one material, one draw instead of six box materials.
  const signBoard = new THREE.Mesh(
    bbGeometry(new THREE.PlaneGeometry(5.6, 2.85)),
    bbSignMat
  );

  signBoard.position.set(0, 4, 0.125);
  signBoard.receiveShadow = true;
  signBoard.castShadow = false;
  signBoard.userData.bbKeep = true;

  billboardGroup.add(signBoard);

  // ===== Merge static meshes by material =====
  function bbMergeStatic(group) {
    const buckets = new Map();

    for (const mesh of group.children.slice()) {
      if (!mesh.isMesh || mesh.userData.bbKeep) continue;

      const key =
        mesh.material.uuid + ':' +
        Number(mesh.castShadow) + ':' +
        Number(mesh.receiveShadow);

      if (!buckets.has(key)) {
        buckets.set(key, []);
      }

      buckets.get(key).push(mesh);
    }

    for (const meshes of buckets.values()) {
      if (meshes.length < 2) continue;

      const positions = [];
      const normals = [];
      const uvs = [];

      for (const mesh of meshes) {
        mesh.updateMatrix();

        const geometry = mesh.geometry.index
          ? mesh.geometry.toNonIndexed()
          : mesh.geometry.clone();

        geometry.applyMatrix4(mesh.matrix);

        const p = geometry.getAttribute('position');
        const n = geometry.getAttribute('normal');
        const uv = geometry.getAttribute('uv');

        for (let i = 0; i < p.count; i++) {
          positions.push(
            p.getX(i), p.getY(i), p.getZ(i)
          );

          normals.push(
            n.getX(i), n.getY(i), n.getZ(i)
          );

          uvs.push(
            uv ? uv.getX(i) : 0,
            uv ? uv.getY(i) : 0
          );
        }

        geometry.dispose();
        group.remove(mesh);
      }

      const geometry = bbGeometry(
        new THREE.BufferGeometry()
      );

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );

      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(normals, 3)
      );

      geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(uvs, 2)
      );

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      const merged = new THREE.Mesh(
        geometry,
        meshes[0].material
      );

      merged.castShadow = meshes[0].castShadow;
      merged.receiveShadow = meshes[0].receiveShadow;

      group.add(merged);
    }

    for (const mesh of group.children) {
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
    }
  }

  bbMergeStatic(billboardGroup);

  // Original world placement preserved.
  scene.add(billboardGroup);

  // Register actual meshes: recursive raycasting is not required here.
  for (const mesh of billboardGroup.children) {
    if (mesh.isMesh) shootables.push(mesh);
  }

  // No PointLight: existing environment lighting illuminates the sign.

  // ===== Shooting target =====
  function bbMakeTargetTexture() {
    const [canvas, ctx] = bbCanvas(256, 256);

    ctx.fillStyle = '#c2b798';
    ctx.fillRect(0, 0, 256, 256);

    const rings = [
      [116, '#494a3c'],
      [94, '#c9bea0'],
      [72, '#535343'],
      [49, '#c9bea0'],
      [25, '#963e2e']
    ];

    for (const ring of rings) {
      ctx.fillStyle = ring[1];
      ctx.beginPath();
      ctx.arc(128, 128, ring[0], 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 1500; i++) {
      ctx.fillStyle = 'rgba(40,34,23,0.12)';

      ctx.fillRect(
        bbRandom() * 256,
        bbRandom() * 256,
        1 + bbRandom() * 2,
        1
      );
    }

    return bbTexture(canvas, true);
  }

  const bbTargetMat = bbMaterial({
    map: bbMakeTargetTexture(),
    roughness: 0.95,
    metalness: 0
  });

  const bbTargetEdgeMat = bbMaterial({
    color: '#575b4c',
    roughness: 0.8,
    metalness: 0.3
  });

  const target = new THREE.Mesh(
    bbGeometry(
      new THREE.CylinderGeometry(0.6, 0.6, 0.12, 24)
    ),
    [
      bbTargetEdgeMat,
      bbTargetMat,
      bbTargetMat
    ]
  );

  target.position.set(0, 1.4, -20);
  target.rotation.x = Math.PI / 2;
  target.castShadow = true;
  target.receiveShadow = true;

  // Keep target transform dynamic for existing gameplay code.
  scene.add(target);
  shootables.push(target);

  // ===== Cleanup =====
  // Call after removing this billboard/target and their shootable references.
  function disposeBillboardResources() {
    bbResources.geometries.forEach(g => g.dispose());
    bbResources.materials.forEach(m => m.dispose());
    bbResources.textures.forEach(t => t.dispose());

    bbResources.geometries.clear();
    bbResources.materials.clear();
    bbResources.textures.clear();
  }
`;
