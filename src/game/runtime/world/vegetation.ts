/** Source fragment: assembled in order; shares its parent factory scope. */
export const vegetation = String.raw`  // ===== نخل‌ها =====
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

`;
