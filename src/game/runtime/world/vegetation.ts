/** Source fragment: assembled in order; shares its parent factory scope. */
export const vegetation = String.raw`
  // ===== نخل‌های کم‌هزینه با برگچه‌های هندسی =====
  // Shared resources: 2 meshes per palm, no external assets.

  let palmSeed = 7319;

  function palmRandom() {
    palmSeed = (
      Math.imul(palmSeed, 1664525) + 1013904223
    ) | 0;

    return (palmSeed >>> 0) / 4294967296;
  }

  // ===== بافت پوست تنه =====
  function makePalmBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#77634c';
    ctx.fillRect(0, 0, 256, 512);

    // جای اتصال برگ‌های قدیمی به تنه
    for (let row = 0; row < 32; row++) {
      const y = row * 16;

      ctx.fillStyle = row % 2
        ? '#79664f'
        : '#695740';

      ctx.fillRect(0, y, 256, 16);

      for (let col = -1; col < 9; col++) {
        const x = col * 36 + (row % 2) * 18;
        const height = 10 + palmRandom() * 4;

        ctx.beginPath();
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x + 18, y + height);
        ctx.lineTo(x + 36, y + 2);

        ctx.strokeStyle = 'rgba(37,28,18,0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 2, y + 4);
        ctx.lineTo(x + 18, y + height + 2);
        ctx.lineTo(x + 34, y + 4);

        ctx.strokeStyle = 'rgba(190,164,120,0.32)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // الیاف و ترک‌های ریز
    for (let i = 0; i < 2400; i++) {
      const x = palmRandom() * 256;
      const y = palmRandom() * 512;

      ctx.strokeStyle = palmRandom() > 0.5
        ? 'rgba(218,193,148,0.12)'
        : 'rgba(30,24,17,0.19)';

      ctx.lineWidth = 0.5 + palmRandom();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + (palmRandom() - 0.5) * 3,
        y + 2 + palmRandom() * 10
      );
      ctx.stroke();
    }

    const color = new THREE.CanvasTexture(canvas);

    if (THREE.SRGBColorSpace !== undefined) {
      color.colorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding !== undefined) {
      color.encoding = THREE.sRGBEncoding;
    }

    // نقشهٔ ارتفاع مستقل با فضای رنگ خطی
    const height = new THREE.CanvasTexture(canvas);

    return { color, height };
  }

  const palmBark = makePalmBarkTexture();

  const palmTrunkMaterial = new THREE.MeshStandardMaterial({
    map: palmBark.color,
    bumpMap: palmBark.height,
    bumpScale: 0.025,
    color: '#d0c2aa',
    roughness: 0.98,
    metalness: 0
  });

  const palmLeafMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.88,
    metalness: 0
  });

  // ===== تنهٔ خمیده با حلقه‌های نامنظم =====
  function palmTrunkCenter(t) {
    return new THREE.Vector3(
      0.28 * t * t,
      4.5 * t,
      0.1 * Math.sin(t * Math.PI * 0.8)
    );
  }

  function makePalmTrunkGeometry() {
    const positions = [];
    const uvs = [];
    const indices = [];

    const rings = 38;
    const sides = 10;

    for (let y = 0; y <= rings; y++) {
      const t = y / rings;
      const center = palmTrunkCenter(t);

      const taper = THREE.MathUtils.lerp(0.31, 0.145, t);

      // تورم پایه و برجستگی حلقه‌های پوست
      const baseFlare = 0.075 * Math.exp(-t * 15);
      const ringRidge = y % 2 === 0 ? 0.014 : -0.005;

      for (let side = 0; side <= sides; side++) {
        const angle = side / sides * Math.PI * 2;

        const irregularity =
          1 + 0.035 * Math.sin(angle * 3 + t * 19);

        const radius =
          (taper + baseFlare + ringRidge) * irregularity;

        positions.push(
          center.x + Math.cos(angle) * radius,
          center.y,
          center.z + Math.sin(angle) * radius
        );

        uvs.push(side / sides, t);
      }
    }

    for (let y = 0; y < rings; y++) {
      for (let side = 0; side < sides; side++) {
        const a = y * (sides + 1) + side;
        const b = a + sides + 1;

        indices.push(
          a, b, a + 1,
          b, b + 1, a + 1
        );
      }
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(uvs, 2)
    );

    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    return geometry;
  }

  // ===== تاج نخل: ساقهٔ قوسی + برگچه‌های باریک =====
  function makePalmCrownGeometry() {
    const positions = [];
    const colors = [];

    const green = new THREE.Color('#596b36');
    const fresh = new THREE.Color('#72834a');
    const shaded = new THREE.Color('#35472a');
    const dry = new THREE.Color('#927a4e');

    function triangle(a, b, c, color) {
      positions.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z
      );

      for (let i = 0; i < 3; i++) {
        colors.push(color.r, color.g, color.b);
      }
    }

    function strip(a, b, side, widthA, widthB, color) {
      const a1 = a.clone().addScaledVector(side, widthA);
      const a2 = a.clone().addScaledVector(side, -widthA);
      const b1 = b.clone().addScaledVector(side, widthB);
      const b2 = b.clone().addScaledVector(side, -widthB);

      triangle(a1, a2, b1, color);
      triangle(a2, b2, b1, color);
    }

    // برگچهٔ نیزه‌ای خمیده؛ بدون بافت شفاف و overdraw سنگین
    function leaflet(base, tip, width, color) {
      const direction = tip.clone().sub(base).normalize();

      const across = new THREE.Vector3(
        -direction.z,
        0,
        direction.x
      ).normalize();

      const middle = base.clone().lerp(tip, 0.43);
      middle.y += 0.045;

      const left = middle.clone().addScaledVector(across, width);
      const right = middle.clone().addScaledVector(across, -width);

      triangle(base, right, left, color);
      triangle(left, right, tip, color);
    }

    const frondCount = 13;

    for (let f = 0; f < frondCount; f++) {
      const old = f >= 10;

      // زاویهٔ طلایی برای جلوگیری از آرایش ستاره‌ای مصنوعی
      const angle = f * 2.39996323;

      const radial = new THREE.Vector3(
        Math.cos(angle),
        0,
        Math.sin(angle)
      );

      const lateral = new THREE.Vector3(
        -Math.sin(angle),
        0,
        Math.cos(angle)
      );

      const length = old
        ? 1.65 + palmRandom() * 0.4
        : 2.05 + palmRandom() * 0.6;

      const lift = old ? 0.1 : 0.48 + palmRandom() * 0.35;
      const droop = old ? 1.5 : 0.48 + palmRandom() * 0.45;

      const baseColor = old
        ? dry.clone()
        : green.clone().lerp(fresh, palmRandom() * 0.6);

      function point(t) {
        const p = radial.clone().multiplyScalar(length * t);

        p.y =
          0.08 +
          Math.sin(t * Math.PI) * lift -
          t * t * droop;

        // انحنای جانبی ظریف
        p.addScaledVector(
          lateral,
          Math.sin(t * Math.PI) * 0.08
        );

        return p;
      }

      const segments = 20;

      for (let s = 0; s < segments; s++) {
        const t0 = s / segments;
        const t1 = (s + 1) / segments;

        strip(
          point(t0),
          point(t1),
          lateral,
          0.019 * (1 - t0) + 0.003,
          0.019 * (1 - t1) + 0.003,
          baseColor
        );
      }

      for (let s = 2; s < segments; s++) {
        const t = s / segments;

        const spread =
          Math.pow(Math.sin(t * Math.PI), 0.8) *
          (old ? 0.38 : 0.58);

        for (const sign of [-1, 1]) {
          // چند برگچهٔ افتاده در برگ‌های خشک
          if (old && palmRandom() < 0.24) continue;

          const base = point(t + sign * 0.006);

          const tip = base.clone()
            .addScaledVector(
              lateral,
              sign * spread * (0.85 + palmRandom() * 0.2)
            )
            .addScaledVector(radial, -0.13 - t * 0.08);

          tip.y -=
            0.08 +
            spread * 0.28 +
            palmRandom() * 0.06;

          const color = baseColor.clone().lerp(
            shaded,
            old ? 0.05 : palmRandom() * 0.28
          );

          leaflet(
            base,
            tip,
            0.022 + Math.sin(t * Math.PI) * 0.014,
            color
          );
        }
      }

      // نوک باریک برگ
      const end = point(1);
      const tip = end.clone().addScaledVector(radial, 0.2);
      tip.y -= 0.12;

      leaflet(point(0.91), tip, 0.022, baseColor);
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    return geometry;
  }

  const palmTrunkGeometry = makePalmTrunkGeometry();
  const palmCrownGeometry = makePalmCrownGeometry();
  const palmCrownPosition = palmTrunkCenter(1);

  function palm(x, z, scale, rotation) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
      palmTrunkGeometry,
      palmTrunkMaterial
    );

    trunk.castShadow = true;
    trunk.receiveShadow = true;

    const crown = new THREE.Mesh(
      palmCrownGeometry,
      palmLeafMaterial
    );

    crown.position.copy(palmCrownPosition);
    crown.castShadow = true;
    crown.receiveShadow = true;

    group.add(trunk, crown);

    group.position.set(x, 0, z);
    group.scale.setScalar(scale || 1);
    group.rotation.y = rotation || 0;

    // آبجکت‌ها ثابت‌اند؛ محاسبهٔ ماتریس در هر فریم لازم نیست
    trunk.updateMatrix();
    trunk.matrixAutoUpdate = false;

    crown.updateMatrix();
    crown.matrixAutoUpdate = false;

    group.updateMatrix();
    group.matrixAutoUpdate = false;

    scene.add(group);

    // همان الگوی قبلی: Meshها مستقیماً قابل شلیک‌اند
    shootables.push(trunk, crown);

    return group;
  }

  palm(-12, 18, 1.05, 0.35);
  palm(14, -20, 0.94, 2.1);
  palm(-22, -15, 1.12, 4.4);
  palm(22, 20, 0.98, 1.3);

  // ===== شبکه فقط برای دیباگ؛ در محیط واقعی نمایش داده نشود =====
  const grid = new THREE.GridHelper(
    60,
    30,
    MAP.gridColor,
    0x9a7a4a
  );

  grid.position.set(0, 0.02, 0);
  grid.visible = false;
  scene.add(grid);
`;
