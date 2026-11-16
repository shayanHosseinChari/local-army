import type { GameConfig } from "../config/gameConfig";

/** Emits the existing launch/map-switch lifecycle without changing its semantics. */
export function createBootstrapScript(gameConfig: GameConfig): string {
  return `      window.startGame = function() {
      try {
        if (!window.THREE) throw new Error('Three.js is unavailable.');

        // ✅ base config با maps پیش‌فرض
        const baseConfig = ${JSON.stringify(gameConfig)};
        if (!baseConfig.maps) baseConfig.maps = { current: 'desert' };

        let currentConfig = JSON.parse(JSON.stringify(baseConfig));
        let currentEngine = null;

        function launchGame(mapName) {
          if (currentEngine) {
            try { currentEngine.dispose(); } catch (e) {}
            currentEngine = null;
          }

          // ✅ همیشه maps رو کامل ست کن
          const safeMap = mapName || (currentConfig.maps && currentConfig.maps.current) || 'desert';
          currentConfig.maps = { current: safeMap };

          try {
            const world = createWorld(window.THREE, currentConfig);
            const physics = createPhysics(world, currentConfig);
            const controls = createControls(world, currentConfig);
            const combat = createCombat(window.THREE, world, currentConfig, setStatus);
            currentEngine = createEngine(world, controls, physics, combat, setStatus);
          } catch (err) {
            reportError(err);
          }
        }

        window.switchMap = function(mapName) {
          if (window.gameStats) {
            window.gameStats.kills = 0;
            window.gameStats.shots = 0;
            window.gameStats.score = 0;
            if (window.setKillCount) window.setKillCount(0);
            if (window.setShotCount) window.setShotCount(0);
            if (window.setScore) window.setScore(0);
          }
          launchGame(mapName);
        };

        // ✅ مپ پیش‌فرض
        const initialMap = (baseConfig.maps && baseConfig.maps.current) || 'desert';
        launchGame(initialMap);

        window.setKillCount(0);
        window.setShotCount(0);
        window.setScore(0);
      } catch (error) {
        reportError(error);
      }
    };`;
}
