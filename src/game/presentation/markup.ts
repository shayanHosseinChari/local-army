/** Source fragment: assembled in order; shares its parent factory scope. */
export const gameMarkup = `  <div id="status" style="opacity:0">Loading Three.js...</div>
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
      <button class="mapOption active" data-map="desert"> Desert</button>
      <button class="mapOption" data-map="urban"> Urban</button>
      <button class="mapOption" data-map="snow">Snow</button>
    </div>
    <button id="resumeButton">RESUME</button>
  </div>
`;
