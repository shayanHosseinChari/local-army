/** Source fragment: assembled in order; shares its parent factory scope. */
export const state = String.raw`
function createCombat(THREE, world, config, setStatus) {
  const button = document.getElementById('fireButton');
  const crosshair = document.getElementById('crosshair');
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  let lastShotAt = -Infinity;
  let respawnAt = 0;
  let enabled = true;
  let gameOver = false;

  let firing = false;
  let autoFireTimer = null;

`;
