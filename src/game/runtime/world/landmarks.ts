/** Source fragment: assembled in order; shares its parent factory scope. */
export const landmarks = String.raw`
  // ===== Shared procedural resources =====
  // Match this value to TERRAIN_SIZE.
  const llMapSize = 100;

  const llResources = {
    geometries: new Set(),
    materials: new Set(),
    textures: new Set()
  };

  const llGeo = geometry => {
    llResources.geometries.add(geometry);
    return geometry;
  };

  function llMat(parameters) {
    const material = new THREE.MeshStandardMaterial(parameters);
    llResources.materials.add(material);
    return material;
  }

  let llSeed = 48271;

  function llRandom() {
    llSeed = (
      Math.imul(llSeed, 1664525) + 1013904223
    ) | 0;

    return (llSeed >>> 0) / 4294967296;
  }

  function llCanvas(width, height) {
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    return [canvas, canvas.getContext('2d')];
  }

  function llTexture(canvas, isColor) {
    const texture = new THREE.CanvasTexture(canvas);

    if (isColor) {
      if (THREE.SRGBColorSpace !== undefined) {
        texture.colorSpace = THREE.SRGBColorSpace;
      } else if (THREE.sRGBEncoding !== undefined) {
        texture.encoding = THREE.sRGBEncoding;
      }
    }

    llResources.textures.add(texture);

    return texture;
  }

  function llWeather(ctx, width, height, count) {
    for (let i = 0; i < count; i++) {
      const bright = llRandom() > 0.65;

      ctx.fillStyle = bright
        ? 'rgba(232,220,188,0.09)'
        : 'rgba(15,12,8,0.12)';

      ctx.fillRect(
        llRandom() * width,
        llRandom() * height,
        1 + llRandom() * 4,
        1 + llRandom() * 2
      );
    }

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.1,
      width / 2,
      height / 2,
      width * 0.58
    );

    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(15,10,5,0.32)');

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  // ===== Fabric branding =====
  function makeLogoTexture(bgColor, textColor, logoText) {
    const [canvas, ctx] = llCanvas(512, 256);

    ctx.fillStyle = bgColor || '#393429';
    ctx.fillRect(0, 0, 512, 256);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(225,214,179,0.07)';
    ctx.beginPath();

    for (let x = 0; x < 512; x += 4) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
    }

    for (let y = 0; y < 256; y += 4) {
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
    }

    ctx.stroke();

    ctx.strokeStyle = '#a39670';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 488, 232);

    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = '#77705b';
    ctx.strokeRect(19, 19, 474, 218);
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = textColor || '#d8cfb1';
    ctx.font = 'bold 66px "Courier New", monospace';

    ctx.fillText(
      logoText || 'LIFE LANDS',
      256,
      111,
      450
    );

    ctx.fillStyle = '#aa9c78';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(
      'FIELD DIVISION  /  EST. 2024',
      256,
      184
    );

    ctx.fillRect(96, 151, 320, 2);

    llWeather(ctx, 512, 256, 2100);

    return llTexture(canvas, true);
  }

  const flagTex = makeLogoTexture(
    '#39372d',
    '#d8ceb1',
    'LIFE LANDS'
  );

  const bannerTex = makeLogoTexture(
    '#403b30',
    '#d3bd85',
    'LIFELANDS'
  );

  const [llFabricCanvas, llFabricCtx] = llCanvas(128, 128);

  llFabricCtx.fillStyle = '#888';
  llFabricCtx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 128; i += 4) {
    llFabricCtx.fillStyle = '#999';
    llFabricCtx.fillRect(i, 0, 1, 128);

    llFabricCtx.fillStyle = '#777';
    llFabricCtx.fillRect(0, i, 128, 1);
  }

  const llFabricBump = llTexture(llFabricCanvas, false);

  // ===== Crate color texture =====
  function makeCrateTexture() {
    const [canvas, ctx] = llCanvas(256, 256);

    ctx.fillStyle = '#766047';
    ctx.fillRect(0, 0, 256, 256);

    for (let plank = 0; plank < 5; plank++) {
      const y = plank * 51;

      ctx.fillStyle = plank % 2
        ? '#7a644b'
        : '#6e5942';

      ctx.fillRect(0, y, 256, 50);

      for (let i = 0; i < 85; i++) {
        const lineY = y + llRandom() * 49;
        const x = llRandom() * 256;

        ctx.strokeStyle = llRandom() > 0.5
          ? 'rgba(31,23,15,0.19)'
          : 'rgba(193,163,115,0.16)';

        ctx.lineWidth = 0.5 + llRandom();
        ctx.beginPath();
        ctx.moveTo(x, lineY);

        ctx.bezierCurveTo(
          x + 20, lineY - 2,
          x + 50, lineY + 2,
          x + 100, lineY
        );

        ctx.stroke();
      }

      ctx.fillStyle = '#3f3428';
      ctx.fillRect(0, y, 256, 2);

      ctx.fillStyle = 'rgba(200,177,133,0.25)';
      ctx.fillRect(0, y + 2, 256, 1);
    }

    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(-0.035);

    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#ccc4a4';
    ctx.textAlign = 'center';

    ctx.font = 'bold 41px monospace';
    ctx.fillText('LL', 0, -6);

    ctx.font = 'bold 17px monospace';
    ctx.fillText('FIELD SUPPLY', 0, 23);

    ctx.font = '12px monospace';
    ctx.fillText('NO. 024 / KEEP DRY', 0, 46);

    ctx.restore();

    llWeather(ctx, 256, 256, 1900);

    return llTexture(canvas, true);
  }

  const crateTex = makeCrateTexture();

  // Independent height texture: printed lettering remains flat.
  const [llWoodHeightCanvas, llWoodHeightCtx] =
    llCanvas(256, 256);

  const llWoodHeightImage =
    llWoodHeightCtx.createImageData(256, 256);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const seamDistance = y % 51;

      const grain =
        Math.sin(
          y * 2.8 + Math.sin(x * 0.035) * 1.8
        ) * 7 +
        Math.sin(y * 7.1 + x * 0.018) * 3;

      const seam = seamDistance < 2 ? -52 : 0;
      const noise = (llRandom() - 0.5) * 12;
      const value = 145 + grain + seam + noise;

      const index = (y * 256 + x) * 4;

      llWoodHeightImage.data[index] = value;
      llWoodHeightImage.data[index + 1] = value;
      llWoodHeightImage.data[index + 2] = value;
      llWoodHeightImage.data[index + 3] = 255;
    }
  }

  llWoodHeightCtx.putImageData(llWoodHeightImage, 0, 0);

  const llWoodHeight = llTexture(
    llWoodHeightCanvas,
    false
  );

  // Concrete has its own pore texture, not wood grain.
  const [llConcreteCanvas, llConcreteCtx] =
    llCanvas(128, 128);

  const llConcreteImage =
    llConcreteCtx.createImageData(128, 128);

  for (let i = 0; i < llConcreteImage.data.length; i += 4) {
    const value = 110 + llRandom() * 70;

    llConcreteImage.data[i] = value;
    llConcreteImage.data[i + 1] = value;
    llConcreteImage.data[i + 2] = value;
    llConcreteImage.data[i + 3] = 255;
  }

  llConcreteCtx.putImageData(llConcreteImage, 0, 0);

  const llConcreteBump = llTexture(
    llConcreteCanvas,
    false
  );

  // ===== Shared materials =====
  const llWood = llMat({
    map: crateTex,
    bumpMap: llWoodHeight,
    bumpScale: 0.018,
    roughness: 0.94,
    metalness: 0
  });

  const llBeam = llMat({
    color: '#776247',
    bumpMap: llWoodHeight,
    bumpScale: 0.012,
    roughness: 0.95
  });

  const llSteel = llMat({
    color: '#55564e',
    roughness: 0.73,
    metalness: 0.65
  });

  const llRust = llMat({
    color: '#62503d',
    roughness: 0.94,
    metalness: 0.25
  });

  const llConcrete = llMat({
    color: '#858176',
    bumpMap: llConcreteBump,
    bumpScale: 0.009,
    roughness: 1,
    metalness: 0
  });

  const llDark = llMat({
    color: '#252923',
    roughness: 0.78,
    metalness: 0.45
  });

  const llBoardFront = llMat({
    map: flagTex,
    roughness: 0.93,
    bumpMap: llFabricBump,
    bumpScale: 0.004
  });

  const llLed = llMat({
    color: '#708d82',
    emissive: '#47816c',
    emissiveIntensity: 0.65,
    roughness: 0.55
  });

  // ===== Shared primitives =====
  const llBox = llGeo(
    new THREE.BoxGeometry(1, 1, 1)
  );

  const llCylinder = llGeo(
    new THREE.CylinderGeometry(1, 1, 1, 10)
  );

  const llSphere = llGeo(
    new THREE.SphereGeometry(1, 8, 6)
  );

  function llPart(
    group,
    geometry,
    material,
    x, y, z,
    sx, sy, sz,
    rotationZ
  ) {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);

    if (rotationZ) {
      mesh.rotation.z = rotationZ;
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    return mesh;
  }

  // ===== Merge compatible static parts =====
  function llMerge(group) {
    const buckets = new Map();

    for (const child of group.children.slice()) {
      if (
        !child.isMesh ||
        child.userData.llKeep ||
        Array.isArray(child.material)
      ) continue;

      const key =
        child.material.uuid + ':' +
        Number(child.castShadow) + ':' +
        Number(child.receiveShadow);

      if (!buckets.has(key)) {
        buckets.set(key, {
          material: child.material,
          castShadow: child.castShadow,
          receiveShadow: child.receiveShadow,
          parts: []
        });
      }

      buckets.get(key).parts.push(child);
    }

    for (const bucket of buckets.values()) {
      if (bucket.parts.length < 2) continue;

      const positions = [];
      const normals = [];
      const uvs = [];

      for (const mesh of bucket.parts) {
        mesh.updateMatrix();

        const geometry = mesh.geometry.index
          ? mesh.geometry.toNonIndexed()
          : mesh.geometry.clone();

        geometry.applyMatrix4(mesh.matrix);

        const position = geometry.getAttribute('position');
        const normal = geometry.getAttribute('normal');
        const uv = geometry.getAttribute('uv');

        for (let i = 0; i < position.count; i++) {
          positions.push(
            position.getX(i),
            position.getY(i),
            position.getZ(i)
          );

          normals.push(
            normal.getX(i),
            normal.getY(i),
            normal.getZ(i)
          );

          uvs.push(
            uv ? uv.getX(i) : 0,
            uv ? uv.getY(i) : 0
          );
        }

        geometry.dispose();
        group.remove(mesh);
      }

      const geometry = llGeo(
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

      const mesh = new THREE.Mesh(
        geometry,
        bucket.material
      );

      mesh.castShadow = bucket.castShadow;
      mesh.receiveShadow = bucket.receiveShadow;

      group.add(mesh);
    }

    for (const child of group.children) {
      child.updateMatrix();
      child.matrixAutoUpdate = false;
    }
  }

  function llPlace(group, x, y, z, rotation) {
    llMerge(group);

    group.position.set(x, y, z);
    group.rotation.y = rotation || 0;

    scene.add(group);
    shootables.push(group);

    return group;
  }

  // ===== GPU cloth movement =====
  const llWind = { value: 0 };
  const llWindStart = performance.now();

  function llClothMaterial(map, hanging) {
    const material = llMat({
      map,
      side: THREE.DoubleSide,
      roughness: 0.96,
      metalness: 0,
      bumpMap: llFabricBump,
      bumpScale: 0.006
    });

    material.onBeforeCompile = shader => {
      shader.uniforms.llTime = llWind;

      const pin = hanging
        ? '(1.0 - uv.y)'
        : 'uv.x';

      const width = hanging ? '1.8' : '1.6';
      const height = hanging ? '0.9' : '0.8';

      const pinDerivativeX = hanging ? '0.0' : '1.0';
      const pinDerivativeY = hanging ? '-1.0' : '0.0';

      const wave =
        '\nfloat llPin = ' + pin + ';' +
        '\nfloat llPhase = uv.x * 9.0 + uv.y * 2.5 - llTime * 2.0;\n';

      shader.vertexShader =
        'uniform float llTime;\n' +
        shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>' +
        wave +
        '\nfloat llDx = 0.065 * (' +
          '2.0 * llPin * ' + pinDerivativeX + ' * sin(llPhase)' +
          ' + llPin * llPin * 9.0 * cos(llPhase)' +
        ');' +
        '\nfloat llDy = 0.065 * (' +
          '2.0 * llPin * ' + pinDerivativeY + ' * sin(llPhase)' +
          ' + llPin * llPin * 2.5 * cos(llPhase)' +
        ');' +
        '\nobjectNormal = normalize(vec3(' +
          '-llDx / ' + width + ',' +
          '-llDy / ' + height + ',' +
          '1.0' +
        '));\n'
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>' +
        '\ntransformed.z += ' +
        '0.065 * llPin * llPin * sin(llPhase);\n'
      );
    };

    material.customProgramCacheKey = () => {
      return hanging
        ? 'll-cloth-top-v2'
        : 'll-cloth-left-v2';
    };

    return material;
  }

  const llFlagMaterial = llClothMaterial(flagTex, false);
  const llBannerMaterial = llClothMaterial(bannerTex, true);

  const llFlagGeometry = llGeo(
    new THREE.PlaneGeometry(1.6, 0.8, 16, 6)
  );

  const llBannerGeometry = llGeo(
    new THREE.PlaneGeometry(1.8, 0.9, 16, 8)
  );

  function llCloth(
    group,
    geometry,
    material,
    x, y, z
  ) {
    const mesh = llPart(
      group,
      geometry,
      material,
      x, y, z,
      1, 1, 1
    );

    mesh.userData.llKeep = true;

    // No static shadow silhouette for animated cloth.
    mesh.castShadow = false;

    mesh.onBeforeRender = () => {
      llWind.value =
        (performance.now() - llWindStart) * 0.001;
    };

    return mesh;
  }

  // ===== Flags =====
  function createFlag(x, y, z, rotation) {
    const group = new THREE.Group();

    llPart(
      group, llCylinder, llSteel,
      0, 1.25, 0,
      0.026, 2.5, 0.026
    );

    llPart(
      group, llCylinder, llRust,
      0, 0.13, 0,
      0.044, 0.26, 0.044
    );

    llPart(
      group, llSphere, llSteel,
      0, 2.51, 0,
      0.052, 0.052, 0.052
    );

    llCloth(
      group,
      llFlagGeometry,
      llFlagMaterial,
      0.8, 2, 0
    );

    return llPlace(group, x, y, z, rotation);
  }

  createFlag(-12, 1.4, -8, 0);
  createFlag(12, 1.6, -8, 0);
  createFlag(0, 2, -15, 0);

  createFlag(20, 1.8, 5, Math.PI / 4);
  createFlag(-20, 1.5, 5, -Math.PI / 4);

  // New outer-area cover from the expanded terrain.
  createFlag(-31, 1.35, -28, 0.25);
  createFlag(32, 1.5, 27, Math.PI);

  // ===== Wall banners =====
  function createBanner(x, y, z, rotation) {
    const group = new THREE.Group();

    llPart(
      group, llCylinder, llSteel,
      0, 0.9, 0.03,
      0.027, 2, 0.027,
      Math.PI / 2
    );

    for (const offsetX of [-0.72, 0.72]) {
      llPart(
        group, llBox, llRust,
        offsetX, 0.84, 0.025,
        0.045, 0.12, 0.025
      );
    }

    llCloth(
      group,
      llBannerGeometry,
      llBannerMaterial,
      0, 0.45, 0.04
    );

    return llPlace(group, x, y, z, rotation);
  }

  // For 0.6m boundary walls: roots sit inside the inner face.
  const llWallInset = llMapSize / 2 - 0.36;
  const llBannerSpread = llMapSize * 0.25;

  createBanner(-llBannerSpread, 3, -llWallInset, 0);
  createBanner(llBannerSpread, 3, -llWallInset, 0);

  createBanner(
    -llBannerSpread, 3, llWallInset, Math.PI
  );

  createBanner(
    llBannerSpread, 3, llWallInset, Math.PI
  );

  createBanner(
    -llWallInset, 3, -llBannerSpread, Math.PI / 2
  );

  createBanner(
    -llWallInset, 3, llBannerSpread, Math.PI / 2
  );

  createBanner(
    llWallInset, 3, -llBannerSpread, -Math.PI / 2
  );

  createBanner(
    llWallInset, 3, llBannerSpread, -Math.PI / 2
  );

  // ===== Supply crates =====
  function createCrate(x, z, rotation) {
    const group = new THREE.Group();

    llPart(
      group, llBox, llWood,
      0, 0.4, 0,
      1, 0.8, 1
    );

    for (const face of [-1, 1]) {
      for (const side of [-1, 1]) {
        llPart(
          group, llBox, llBeam,
          side * 0.38, 0.4, face * 0.522,
          0.12, 0.8, 0.045
        );

        llPart(
          group, llBox, llSteel,
          face * 0.523, 0.4, side * 0.37,
          0.046, 0.8, 0.045
        );
      }

      for (const yy of [0.075, 0.725]) {
        llPart(
          group, llBox, llBeam,
          0, yy, face * 0.525,
          1.03, 0.11, 0.05
        );

        for (const xx of [-0.38, 0.38]) {
          llPart(
            group, llSphere, llSteel,
            xx, yy, face * 0.557,
            0.018, 0.018, 0.008
          );
        }
      }

      llPart(
        group, llBox, llSteel,
        face * 0.37, 0.809, 0,
        0.045, 0.018, 1.04
      );
    }

    llPlace(group, x, 0, z, rotation);

    const angle = rotation || 0;

    const half =
      0.565 * (
        Math.abs(Math.cos(angle)) +
        Math.abs(Math.sin(angle))
      );

    obstacles.push({
      minX: x - half,
      maxX: x + half,
      minZ: z - half,
      maxZ: z + half,
      minY: 0,
      maxY: 0.82
    });

    return group;
  }

  createCrate(-18, -12, 0.3);
  createCrate(18, -12, -0.4);
  createCrate(-10, 8, 0.2);
  createCrate(10, 8, -0.3);
  createCrate(-5, -22, 0.5);

  // ===== Signposts =====
  function createSignpost(x, z, rotation) {
    const group = new THREE.Group();

    llPart(
      group, llCylinder, llBeam,
      0, 1.1, 0,
      0.065, 2.2, 0.065
    );

    llPart(
      group, llBox, llBeam,
      0, 1.8, 0,
      1.44, 0.74, 0.1
    );

    const front = llPart(
      group, llBox, llBoardFront,
      0, 1.8, 0.058,
      1.36, 0.66, 0.012
    );

    front.castShadow = false;

    for (const xx of [-0.64, 0.64]) {
      for (const yy of [1.52, 2.08]) {
        llPart(
          group, llSphere, llSteel,
          xx, yy, 0.073,
          0.018, 0.018, 0.008
        );
      }
    }

    return llPlace(group, x, 0, z, rotation);
  }

  createSignpost(-8, 3, -Math.PI / 4);
  createSignpost(8, 3, Math.PI / 4);
  createSignpost(-8, -18, 0);
  createSignpost(8, -18, 0);

  // ===== Worn ground markings =====
  const [llMarkerCanvas, llMarkerCtx] =
    llCanvas(128, 128);

  llMarkerCtx.strokeStyle = 'rgba(184,166,115,0.65)';
  llMarkerCtx.lineWidth = 5;

  llMarkerCtx.beginPath();
  llMarkerCtx.arc(64, 64, 51, 0, Math.PI * 2);
  llMarkerCtx.stroke();

  llMarkerCtx.fillStyle = 'rgba(184,166,115,0.7)';
  llMarkerCtx.font = 'bold 37px monospace';
  llMarkerCtx.textAlign = 'center';
  llMarkerCtx.textBaseline = 'middle';
  llMarkerCtx.fillText('LL', 64, 66);

  llMarkerCtx.globalCompositeOperation = 'destination-out';

  for (let i = 0; i < 1300; i++) {
    llMarkerCtx.fillStyle =
      'rgba(0,0,0,' + (0.2 + llRandom() * 0.6) + ')';

    llMarkerCtx.fillRect(
      llRandom() * 128,
      llRandom() * 128,
      1 + llRandom() * 3,
      1 + llRandom() * 2
    );
  }

  llMarkerCtx.globalCompositeOperation = 'source-over';

  const llMarkerMaterial = llMat({
    map: llTexture(llMarkerCanvas, true),
    transparent: true,
    depthWrite: false,
    roughness: 1,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const llMarkerGeometry = llGeo(
    new THREE.PlaneGeometry(1, 1)
  );

  function createGroundMarker(x, z) {
    const mesh = new THREE.Mesh(
      llMarkerGeometry,
      llMarkerMaterial
    );

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.012, z);

    mesh.receiveShadow = true;

    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;

    scene.add(mesh);

    return mesh;
  }

  createGroundMarker(-15, 10);
  createGroundMarker(15, 10);
  createGroundMarker(-15, -20);
  createGroundMarker(15, -20);
  createGroundMarker(0, 5);
  createGroundMarker(0, -10);

  // ===== World-space collision from local boxes =====
  function llAddLocalObstacle(
    group,
    cx, cy, cz,
    width, height, depth
  ) {
    group.updateWorldMatrix(true, false);

    const bounds = new THREE.Box3();
    const point = new THREE.Vector3();

    for (let ix = -1; ix <= 1; ix += 2) {
      for (let iy = -1; iy <= 1; iy += 2) {
        for (let iz = -1; iz <= 1; iz += 2) {
          point.set(
            cx + ix * width / 2,
            cy + iy * height / 2,
            cz + iz * depth / 2
          );

          point.applyMatrix4(group.matrixWorld);
          bounds.expandByPoint(point);
        }
      }
    }

    obstacles.push({
      minX: bounds.min.x,
      maxX: bounds.max.x,
      minZ: bounds.min.z,
      maxZ: bounds.max.z,
      minY: bounds.min.y,
      maxY: bounds.max.y
    });
  }

  // ===== Main billboard =====
  function createBigBillboard(x, z, rotation) {
    const group = new THREE.Group();

    for (const xx of [-2.5, 2.5]) {
      llPart(
        group, llCylinder, llSteel,
        xx, 4, 0,
        0.2, 8, 0.2
      );

      llPart(
        group, llBox, llConcrete,
        xx, 0.2, 0,
        1.15, 0.4, 1.05
      );

      llPart(
        group, llBox, llRust,
        xx, 0.42, 0,
        0.66, 0.05, 0.66
      );

      for (const dx of [-0.24, 0.24]) {
        for (const dz of [-0.24, 0.24]) {
          llPart(
            group, llCylinder, llSteel,
            xx + dx, 0.47, dz,
            0.032, 0.08, 0.032
          );
        }
      }
    }

    llPart(
      group, llBox, llDark,
      0, 6.5, -0.1,
      6.5, 3.5, 0.3
    );

    for (const yy of [5.15, 7.85]) {
      llPart(
        group, llBox, llSteel,
        0, yy, -0.3,
        5.8, 0.09, 0.1
      );
    }

    for (const xx of [-3.12, 3.12]) {
      for (const yy of [4.9, 8.1]) {
        llPart(
          group, llSphere, llSteel,
          xx, yy, 0.065,
          0.036, 0.036, 0.018
        );
      }
    }

    const screenMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000
    });

    llResources.materials.add(screenMaterial);

    const screen = new THREE.Mesh(
      llGeo(new THREE.PlaneGeometry(6, 3)),
      screenMaterial
    );

    // Keep dimensions and anchor unchanged for the iframe.
    screen.position.set(0, 6.5, 0.1);
    screen.userData.llKeep = true;

    group.add(screen);

    // Visual LEDs only: no extra PointLights.
    for (const xx of [-3.08, 3.08]) {
      const trim = llPart(
        group, llBox, llLed,
        xx, 6.5, 0.075,
        0.025, 2.9, 0.025
      );

      trim.castShadow = false;
    }

    llPlace(group, x, 0, z, rotation);

    // Separate supports: no full-width invisible wall below screen.
    for (const xx of [-2.5, 2.5]) {
      llAddLocalObstacle(
        group,
        xx, 0.2, 0,
        1.15, 0.4, 1.05
      );

      llAddLocalObstacle(
        group,
        xx, 4, 0,
        0.42, 8, 0.42
      );
    }

    llAddLocalObstacle(
      group,
      0, 6.5, -0.1,
      6.5, 3.5, 0.3
    );

    return group;
  }

  const mainBillboard = createBigBillboard(0, -25, 0);

  const billboardScreen = {
    group: mainBillboard,
    localPos: new THREE.Vector3(0, 6.5, 0.1)
  };

  // ===== Cleanup =====
  // Call only after removing level objects from the scene
  // and clearing their references from shootables/obstacles.
  // Shared assets must not be disposed per individual landmark.
  function disposeLandmarkResources() {
    llResources.geometries.forEach(geometry => {
      geometry.dispose();
    });

    llResources.materials.forEach(material => {
      material.dispose();
    });

    llResources.textures.forEach(texture => {
      texture.dispose();
    });

    llResources.geometries.clear();
    llResources.materials.clear();
    llResources.textures.clear();
  }
`;
