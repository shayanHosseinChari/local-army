/** Source fragment: assembled in order; shares its parent factory scope. */
export const billboard = String.raw`  // ===== بیلبورد =====
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
`;
