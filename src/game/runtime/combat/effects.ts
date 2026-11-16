/** Source fragment: assembled in order; shares its parent factory scope. */
export const effects = String.raw`  function clearStatus() { setStatus(''); }

  function spawnImpact(point, normal, onTarget, type) {
    const n = normal ? normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const adjustedPoint = point.clone().addScaledVector(n, 0.015);

    if (type !== 'blood') {
      const outerMat = new THREE.MeshBasicMaterial({
        color: onTarget ? 0xff5555 : 0x8a8a8a,
        transparent: true, opacity: 0.6,
        depthWrite: false, side: THREE.DoubleSide
      });
      const outer = new THREE.Mesh(impactGeo, outerMat);
      outer.position.copy(adjustedPoint);
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), n
      );
      outer.quaternion.copy(q);
      world.scene.add(outer);
      impacts.push({ mesh: outer, life: 12, maxLife: 12, fadeStart: 10, isSpark: false });

      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x000000, transparent: true, opacity: 0.9,
        depthWrite: false, side: THREE.DoubleSide
      });
      const inner = new THREE.Mesh(impactHoleGeo, innerMat);
      inner.position.copy(adjustedPoint);
      inner.position.addScaledVector(n, 0.001);
      inner.quaternion.copy(q);
      world.scene.add(inner);
      impacts.push({ mesh: inner, life: 12, maxLife: 12, fadeStart: 10, isSpark: false });
    }

    while (impacts.length > MAX_IMPACTS) {
      const oldest = impacts.shift();
      world.scene.remove(oldest.mesh);
      oldest.mesh.geometry.dispose();
      oldest.mesh.material.dispose();
    }

    const isBlood = type === 'blood';
    const particleColor = isBlood ? 0xaa0000 : 0x8a7a5a;
    const particleCount = isBlood ? 10 : 6;

    for (let i = 0; i < particleCount; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: particleColor, transparent: true, opacity: 0.9,
        depthWrite: false
      });
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(isBlood ? 0.04 : 0.03, 4, 4),
        pMat
      );
      p.position.copy(point);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );
      vel.addScaledVector(n, isBlood ? 2 : 1.5);

      world.scene.add(p);
      impacts.push({
        mesh: p,
        life: isBlood ? 0.6 : 0.35,
        maxLife: isBlood ? 0.6 : 0.35,
        fadeStart: 0.15,
        isSpark: true,
        velocity: vel
      });
    }
  }

  function updateEffects(delta) {
    if (!delta || delta <= 0) return;
    for (let i = impacts.length - 1; i >= 0; i--) {
      const im = impacts[i];
      im.life -= delta;
      if (im.isSpark && im.velocity) {
        im.mesh.position.addScaledVector(im.velocity, delta);
        im.velocity.y -= 9.8 * delta;
        im.mesh.material.opacity = Math.max(0, im.life / im.maxLife);
      } else if (im.life < im.fadeStart) {
        im.mesh.material.opacity = Math.max(0, (im.life / im.fadeStart) * 0.85);
      }
      if (im.life <= 0) {
        world.scene.remove(im.mesh);
        im.mesh.geometry.dispose();
        im.mesh.material.dispose();
        impacts.splice(i, 1);
      }
    }
  }

`;
