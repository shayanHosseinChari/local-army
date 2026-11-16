/** Source fragment: assembled in order; shares its parent factory scope. */
export const lifecycle = String.raw`  function resize() {
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
