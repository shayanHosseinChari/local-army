/** Source fragment: assembled in order; shares its parent factory scope. */
export const sceneSetup = String.raw`
function createWorld(THREE, config) {
  const scene = new THREE.Scene();

  // ===== تنظیمات مپ =====
  const MAP_CONFIGS = {
    desert: {
      bg: '#d9b382',
      fog: '#d9b382',
      groundColor: '#d4a76a',
      groundSpot: '#c49a5e',
      brickA: '#b08045',
      brickB: '#a07840',
      sunColor: 0xfff5e0,
      hemiSky: 0xffe8c0,
      hemiGround: 0xa08050,
      gridColor: 0x8a6a3a
    },
    urban: {
      bg: '#5a6a7a',
      fog: '#5a6a7a',
      groundColor: '#6a6a70',
      groundSpot: '#5a5a60',
      brickA: '#7a7a80',
      brickB: '#5a5a60',
      sunColor: 0xffffff,
      hemiSky: 0xc0d0e0,
      hemiGround: 0x505050,
      gridColor: 0x4a4a50
    },
    snow: {
      bg: '#dfeaf5',
      fog: '#dfeaf5',
      groundColor: '#e8f0f8',
      groundSpot: '#d0dce8',
      brickA: '#a0b0c0',
      brickB: '#90a0b0',
      sunColor: 0xffffff,
      hemiSky: 0xe0f0ff,
      hemiGround: 0x8090a0,
      gridColor: 0x90a0b0
    }
  };

  const currentMapName = (config.maps && config.maps.current) || 'desert';
  const MAP = MAP_CONFIGS[currentMapName] || MAP_CONFIGS.desert;

  scene.background = new THREE.Color(MAP.bg);
  scene.fog = new THREE.Fog(MAP.fog, 20, 55);

  const camera = new THREE.PerspectiveCamera(
    config.camera.fov, innerWidth / innerHeight, 0.1, 200
  );
  camera.position.set(0, config.player.eyeHeight, 6);
  camera.lookAt(0, 1.4, -4);
  camera.rotation.reorder('YXZ');

  const renderer = new THREE.WebGLRenderer({antialias: false});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, config.graphics.maxPixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(MAP.hemiSky, MAP.hemiGround, 1.0));
  const sun = new THREE.DirectionalLight(MAP.sunColor, 2.5);
  sun.position.set(18, 22, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const obstacles = [];
  const shootables = [];

`;
