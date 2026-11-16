export const physicsScript = String.raw`
function createPhysics(world, config) {
  const radius = config.player.radius;
  function canStandAt(x, z) {
    const b = world.bounds;
    if (x < b.minX + radius || x > b.maxX - radius ||
        z < b.minZ + radius || z > b.maxZ - radius) return false;
    return !world.obstacles.some(function(o) {
      return x > o.minX - radius && x < o.maxX + radius &&
             z > o.minZ - radius && z < o.maxZ + radius;
    });
  }

  function move(input, delta) {
    const yaw = world.camera.rotation.y;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const dx = (input.x * cos + input.y * sin) * config.player.speed * delta;
    const dz = (-input.x * sin + input.y * cos) * config.player.speed * delta;
    const position = world.camera.position;

    // Small substeps reduce tunnelling if speed is increased later.
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.1));
    for (let i = 0; i < steps; i++) {
      if (canStandAt(position.x + dx / steps, position.z)) position.x += dx / steps;
      if (canStandAt(position.x, position.z + dz / steps)) position.z += dz / steps;
    }
  }
  return {canStandAt, move};
}
`;
