import { gameConfig } from "./config";
import { styles } from "./styles";
import { worldScript } from "./world";
import { physicsScript } from "./physics";
import { controlsScript } from "./controls";
import { combatScript } from "./combat";
import { engineScript } from "./engine";

export function createGameHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <style>${styles}</style>
</head>
<body>
  <div id="status">Loading Three.js...</div>
  <div id="crosshair"></div>
  <div id="hitmarker"></div>

  <div id="healthBar">
    <svg id="healthRing" viewBox="0 0 100 100">
      <circle id="healthTrack" cx="50" cy="50" r="42" />
      <circle id="healthFill" cx="50" cy="50" r="42" />
    </svg>
    <div id="healthHeart">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
    <div id="healthText">
      <span id="healthCurrent">100</span>
      <span id="healthSep">/</span>
      <span id="healthMax">100</span>
    </div>
  </div>

  <div id="damageOverlay"></div>

  <div id="statsPanel">
    <div class="statBlock" id="killBlock">
      <div class="statIcon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="1" x2="12" y2="4"/>
          <line x1="12" y1="20" x2="12" y2="23"/>
          <line x1="1" y1="12" x2="4" y2="12"/>
          <line x1="20" y1="12" x2="23" y2="12"/>
        </svg>
      </div>
      <div class="statValue" id="killCount">0</div>
      <div class="statLabel">KILLS</div>
    </div>
    <div class="statDivider"></div>
    <div class="statBlock" id="shotBlock">
      <div class="statIcon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12 L15 12"/>
          <path d="M15 8 L21 12 L15 16 Z" fill="currentColor" stroke="none"/>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </div>
      <div class="statValue" id="shotCount">0</div>
      <div class="statLabel">SHOTS</div>
    </div>
    <div class="statDivider"></div>
    <div class="statBlock" id="scoreBlock">
      <div class="statIcon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2 L14.5 8.5 L21.5 9 L16.2 13.5 L18 20.5 L12 16.8 L6 20.5 L7.8 13.5 L2.5 9 L9.5 8.5 Z"/>
        </svg>
      </div>
      <div class="statValue" id="scoreCount">0</div>
      <div class="statLabel">SCORE</div>
    </div>
  </div>

  <div id="playPauseBtn">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path id="playPauseIcon" d="M6 4h4v16H6zM14 4h4v16h-4z"/>
    </svg>
  </div>

  <div id="joystick"><div id="stick"></div></div>

  <div id="adsButton">
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="8"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  </div>

  <div id="fireButton">
    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2 L14 8 L20 6 L16 12 L20 18 L14 16 L12 22 L10 16 L4 18 L8 12 L4 6 L10 8 Z" opacity="0.85"/>
    </svg>
  </div>

  <div id="gameOver">
    <div id="gameOverTitle">GAME OVER</div>
    <div id="gameOverStats">
      KILLS: <span id="finalKills">0</span><br>
      SCORE: <span id="finalScore">0</span>
    </div>
    <button id="restartButton">RESTART</button>
  </div>

  <!-- ✅ منوی Pause -->
  <div id="pauseMenu">
    <div id="pauseTitle">PAUSED</div>
    <div id="pauseSubtitle">SETTINGS</div>
    <div id="mapLabel">SELECT MAP</div>
    <div id="mapOptions">
      <button class="mapOption active" data-map="desert">🏜️ Desert</button>
      <button class="mapOption" data-map="urban">🏙️ Urban</button>
      <button class="mapOption" data-map="snow">❄️ Snow</button>
    </div>
    <button id="resumeButton">RESUME</button>
  </div>

  <script>
    function setStatus(message) {
      document.getElementById('status').textContent = message;
    }
    function reportError(error) {
      const message = error && error.message ? error.message : String(error);
      setStatus('ERROR: ' + message);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: message}));
      }
    }
    window.addEventListener('error', function(event) {
      if (event.message) reportError(event.message);
    });
    window.addEventListener('unhandledrejection', function(event) {
      reportError(event.reason || 'Unhandled promise rejection');
    });

    window.gameStats = { kills: 0, shots: 0, score: 0 };

    function animateBlock(blockId) {
      const block = document.getElementById(blockId);
      if (!block) return;
      block.classList.remove('pulse');
      void block.offsetWidth;
      block.classList.add('pulse');
    }

    window.setKillCount = function(count) {
      window.gameStats.kills = count;
      const el = document.getElementById('killCount');
      if (el && el.textContent !== String(count)) {
        el.textContent = count;
        animateBlock('killBlock');
      }
    };

    window.setShotCount = function(count) {
      window.gameStats.shots = count;
      const el = document.getElementById('shotCount');
      if (el && el.textContent !== String(count)) {
        el.textContent = count;
        const block = document.getElementById('shotBlock');
        if (block) {
          block.classList.remove('flash');
          void block.offsetWidth;
          block.classList.add('flash');
        }
      }
    };

    window.setScore = function(score) {
      window.gameStats.score = score;
      const el = document.getElementById('scoreCount');
      if (el && el.textContent !== String(score)) {
        el.textContent = score;
        animateBlock('scoreBlock');
      }
    };

    window.incrementKill = function(points) {
      window.setKillCount(window.gameStats.kills + 1);
      window.setScore(window.gameStats.score + (points || 100));
    };
    window.incrementShot = function() {
      window.setShotCount(window.gameStats.shots + 1);
    };

    ${worldScript}
    ${physicsScript}
    ${controlsScript}
    ${combatScript}
    ${engineScript}

      window.startGame = function() {
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
    };
  </script>
  <script
    src="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"
    onload="window.startGame()"
    onerror="reportError('Could not load Three.js.')">
  </script>
</body>
</html>`;
}
