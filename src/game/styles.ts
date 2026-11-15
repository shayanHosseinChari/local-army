export const styles = String.raw`
* { box-sizing: border-box; -webkit-user-select: none; user-select: none;
    -webkit-tap-highlight-color: transparent; }
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden;
  background: #10151c; overscroll-behavior: none; }
canvas { display: block; touch-action: none; }

/* ===== وضعیت ===== */
#status { position: absolute; top: max(16px, env(safe-area-inset-top));
  left: 50%; transform: translateX(-50%); color: white;
  font: 12px sans-serif; text-shadow: 0 1px 3px black; z-index: 4;
  pointer-events: none; text-align: center; padding: 6px 14px;
  background: rgba(0,0,0,0.45); border-radius: 6px; backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px); }

/* ===== کراس‌هیر ===== */
#crosshair {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 28px; height: 28px;
  z-index: 2; pointer-events: none;
}
#crosshair::before {
  content: ''; position: absolute;
  left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 4px; height: 4px; border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(255,255,255,0.8);
  z-index: 2;
}
#crosshair::after {
  content: ''; position: absolute;
  left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 28px; height: 28px;
  background:
    linear-gradient(#fff, #fff) center top / 2px 8px no-repeat,
    linear-gradient(#fff, #fff) center bottom / 2px 8px no-repeat,
    linear-gradient(#fff, #fff) left center / 8px 2px no-repeat,
    linear-gradient(#fff, #fff) right center / 8px 2px no-repeat;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.9)) drop-shadow(0 0 1px rgba(255,255,255,0.9));
  transition: transform 0.12s ease-out, filter 0.12s ease-out;
}
#crosshair.firing::after { transform: translate(-50%, -50%) scale(1.6); }
#crosshair.ads::before {
  width: 3px; height: 3px; background: #ff5050;
  box-shadow: 0 0 6px rgba(255,80,80,1), 0 0 12px rgba(255,80,80,0.7);
}
#crosshair.ads::after {
  transform: translate(-50%, -50%) scale(0.55);
  background:
    linear-gradient(#ff5050, #ff5050) center top / 2px 8px no-repeat,
    linear-gradient(#ff5050, #ff5050) center bottom / 2px 8px no-repeat,
    linear-gradient(#ff5050, #ff5050) left center / 8px 2px no-repeat,
    linear-gradient(#ff5050, #ff5050) right center / 8px 2px no-repeat;
  filter: drop-shadow(0 0 3px rgba(255,80,80,0.9));
}
#crosshair.hit::before { background: #4ade80; }
#crosshair.hit::after {
  background:
    linear-gradient(#4ade80, #4ade80) center top / 2px 8px no-repeat,
    linear-gradient(#4ade80, #4ade80) center bottom / 2px 8px no-repeat,
    linear-gradient(#4ade80, #4ade80) left center / 8px 2px no-repeat,
    linear-gradient(#4ade80, #4ade80) right center / 8px 2px no-repeat;
}

/* ===== Hitmarker ===== */
#hitmarker {
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 26px; height: 26px;
  pointer-events: none; z-index: 10; opacity: 0;
}
#hitmarker::before, #hitmarker::after {
  content: ''; position: absolute;
  width: 26px; height: 2px;
  background: #fff; top: 12px; left: 0;
  box-shadow: 0 0 3px rgba(0,0,0,0.9), 0 0 1px rgba(255,255,255,0.8);
}
#hitmarker::before { transform: rotate(45deg); }
#hitmarker::after { transform: rotate(-45deg); }
#hitmarker.show { animation: hitmark 0.3s ease-out; }
#hitmarker.kill::before, #hitmarker.kill::after {
  background: #ff4a4a;
  box-shadow: 0 0 6px rgba(255,74,74,0.9);
}
#hitmarker.headshot::before, #hitmarker.headshot::after {
  background: #ffd700;
  box-shadow: 0 0 8px rgba(255,215,0,0.9), 0 0 16px rgba(255,215,0,0.5);
}
@keyframes hitmark {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
}

/* ===== پنل آمار ===== */
#statsPanel {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 14px);
  left: calc(env(safe-area-inset-left, 0px) + 14px);
  display: flex; align-items: stretch;
  padding: 8px 10px;
  background: linear-gradient(135deg, rgba(30,26,18,0.88), rgba(20,16,10,0.92));
  border: 1px solid rgba(232,184,74,0.45);
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(232,184,74,0.15);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none; user-select: none; z-index: 20;
  font-family: 'Courier New', monospace;
}
.statBlock {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 2px; padding: 6px 12px;
  min-width: 62px; border-radius: 8px;
  position: relative;
  transition: background 0.2s ease;
}
.statIcon {
  display: flex; align-items: center; justify-content: center;
  height: 20px; color: #e8b84a;
  filter: drop-shadow(0 0 4px rgba(232,184,74,0.55));
}
#scoreBlock .statIcon { color: #ffd75a; }
#shotBlock .statIcon { color: #c4a878; }
.statValue {
  font-size: 22px; font-weight: 900; color: #f5e6c0; line-height: 1;
  text-shadow: 0 0 6px rgba(232,184,74,0.45), 0 2px 0 rgba(0,0,0,0.6);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
  min-width: 40px; text-align: center;
}
#scoreBlock .statValue { color: #ffe08a; }
.statLabel {
  font-size: 8px; font-weight: 700; color: #c4a878;
  letter-spacing: 2px; opacity: 0.85; margin-top: 1px;
}
.statDivider {
  width: 1px; margin: 6px 2px;
  background: linear-gradient(to bottom,
    transparent,
    rgba(232,184,74,0.35) 20%,
    rgba(232,184,74,0.35) 80%,
    transparent);
}
.statBlock.pulse { animation: blockPulse 0.45s ease-out; }
.statBlock.pulse .statValue { animation: valuePop 0.45s ease-out; }
@keyframes blockPulse {
  0% { background: rgba(232,184,74,0.35); }
  100% { background: transparent; }
}
@keyframes valuePop {
  0% { transform: scale(1); }
  35% { transform: scale(1.35); color: #fff; }
  100% { transform: scale(1); }
}
.statBlock.flash { animation: shotFlash 0.15s ease-out; }
@keyframes shotFlash {
  0% { background: rgba(196,168,120,0.4); }
  100% { background: transparent; }
}

/* ===== جوی‌استیک ===== */
#joystick {
  position: absolute;
  left: max(28px, env(safe-area-inset-left));
  bottom: max(28px, env(safe-area-inset-bottom));
  width: 130px; height: 130px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: 2px solid rgba(255,255,255,0.25);
  z-index: 3; touch-action: none;
}
#stick {
  position: absolute; left: 50%; top: 50%;
  width: 54px; height: 54px;
  margin-left: -27px; margin-top: -27px;
  border-radius: 50%;
  background: rgba(255,255,255,0.45);
  border: 2px solid rgba(255,255,255,0.65);
  pointer-events: none;
}

/* ===== دکمه شلیک ===== */
#fireButton {
  position: fixed;
  right: calc(env(safe-area-inset-right, 0px) + 22px);
  bottom: calc(env(safe-area-inset-bottom, 0px) + 28px);
  width: 82px; height: 82px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 35% 30%,
    rgba(200,60,40,0.85), rgba(120,20,10,0.9));
  border: 2px solid rgba(255,140,100,0.5);
  box-shadow:
    0 6px 20px rgba(120,20,10,0.55),
    inset 0 2px 4px rgba(255,200,160,0.25);
  color: #fff2e6; z-index: 20;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.08s ease, box-shadow 0.08s ease;
  touch-action: none;
  pointer-events: auto;
}
#fireButton:active {
  transform: scale(0.92);
  box-shadow:
    0 2px 10px rgba(120,20,10,0.7),
    inset 0 2px 8px rgba(255,120,80,0.4);
}

/* ===== دکمه ADS ===== */
#adsButton {
  position: fixed;
  right: calc(env(safe-area-inset-right, 0px) + 120px);
  bottom: calc(env(safe-area-inset-bottom, 0px) + 36px);
  width: 58px; height: 58px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 35% 30%,
    rgba(60,100,140,0.85), rgba(20,40,60,0.9));
  border: 2px solid rgba(120,200,255,0.5);
  box-shadow:
    0 6px 18px rgba(20,40,60,0.55),
    inset 0 2px 4px rgba(180,220,255,0.25);
  color: #cceeff; z-index: 20;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease;
  touch-action: none;
  pointer-events: auto;
}
#adsButton.active {
  background: radial-gradient(circle at 35% 30%,
    rgba(120,200,255,0.95), rgba(40,100,160,0.95));
  border-color: rgba(180,230,255,0.9);
  box-shadow:
    0 0 20px rgba(120,200,255,0.8),
    inset 0 2px 6px rgba(200,240,255,0.4);
  transform: scale(0.95);
}
#adsButton:active { transform: scale(0.92); }

/* ===== نوار سلامت دایره‌ای ===== */
#healthBar {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 14px);
  right: calc(env(safe-area-inset-right, 0px) + 14px);
  width: 84px; height: 84px;
  z-index: 20;
  pointer-events: none; user-select: none;
  display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));
}
#healthRing {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  transform: rotate(-90deg);
}
#healthTrack {
  fill: none;
  stroke: rgba(20,16,10,0.85);
  stroke-width: 6;
}
#healthFill {
  fill: none;
  stroke: #ff3a5e;
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 263.89;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 0.4s ease, stroke 0.3s ease;
  filter: drop-shadow(0 0 4px rgba(255,58,94,0.8));
}
#healthFill.warning {
  stroke: #facc15;
  filter: drop-shadow(0 0 5px rgba(250,204,21,0.9));
}
#healthFill.danger {
  stroke: #ef4444;
  filter: drop-shadow(0 0 6px rgba(239,68,68,1));
  animation: healthPulse 0.7s ease-in-out infinite;
}
@keyframes healthPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
#healthHeart {
  color: #ff3a5e;
  display: flex; align-items: center; justify-content: center;
  z-index: 2;
  filter: drop-shadow(0 0 6px rgba(255,58,94,0.9))
          drop-shadow(0 0 14px rgba(255,58,94,0.5));
  animation: heartBeat 1.2s ease-in-out infinite;
  transition: color 0.3s ease;
}
#healthHeart svg { display: block; fill: currentColor; }
@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.15); }
  30% { transform: scale(1); }
  45% { transform: scale(1.1); }
  60% { transform: scale(1); }
}
#healthBar.danger #healthHeart {
  animation: heartBeatFast 0.5s ease-in-out infinite;
  color: #ff2a2a;
  filter: drop-shadow(0 0 10px rgba(255,42,42,1))
          drop-shadow(0 0 22px rgba(255,42,42,0.7));
}
@keyframes heartBeatFast {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}
#healthBar.warning #healthHeart {
  color: #facc15;
  filter: drop-shadow(0 0 8px rgba(250,204,21,0.9));
}
#healthText {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 900;
  color: #f5e6c0;
  text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(255,58,94,0.4);
  letter-spacing: 0.5px;
  z-index: 3;
  background: rgba(20,16,10,0.85);
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid rgba(232,184,74,0.4);
  white-space: nowrap;
}
#healthCurrent { color: #ff6b8a; min-width: 22px; text-align: right; }
#healthSep { color: #c4a878; opacity: 0.8; margin: 0 1px; }
#healthMax { color: #c4a878; min-width: 22px; text-align: left; opacity: 0.9; }

/* ===== افکت آسیب ===== */
#damageOverlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at center,
    transparent 40%,
    rgba(220,38,38,0.6) 100%);
  pointer-events: none;
  z-index: 15;
  opacity: 0;
}
#damageOverlay.hit { animation: damageFlash 0.4s ease-out; }
@keyframes damageFlash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== صفحه گیم‌اور ===== */
#gameOver {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(10,5,5,0.92);
  z-index: 100;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
#gameOver.show { display: flex; animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
#gameOverTitle {
  font-family: 'Courier New', monospace;
  font-size: 48px;
  font-weight: 900;
  color: #ff3333;
  letter-spacing: 6px;
  text-shadow:
    0 0 20px rgba(255,51,51,0.9),
    0 0 40px rgba(255,51,51,0.5),
    0 4px 0 rgba(0,0,0,0.8);
  margin-bottom: 20px;
  animation: pulseRed 2s ease-in-out infinite;
}
@keyframes pulseRed {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
#gameOverStats {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: #c4a878;
  letter-spacing: 2px;
  margin-bottom: 40px;
  text-align: center;
  line-height: 1.8;
}
#gameOverStats span { color: #f5e6c0; font-weight: 900; }
#restartButton {
  padding: 14px 40px;
  background: linear-gradient(135deg, #8a2a2a, #5a1a1a);
  border: 2px solid rgba(255,100,100,0.6);
  border-radius: 8px;
  color: #fff2e6;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 3px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(138,42,42,0.6);
  transition: transform 0.1s, box-shadow 0.2s;
}
#restartButton:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(138,42,42,0.8);
}

/* ===== دکمه Play/Pause ===== */
#playPauseBtn {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 14px);
  right: calc(env(safe-area-inset-right, 0px) + 200px);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,
    rgba(30,26,18,0.85), rgba(20,16,10,0.9));
  border: 1px solid rgba(232,184,74,0.5);
  color: #e8b84a;
  z-index: 25;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 14px rgba(0,0,0,0.5);
  transition: transform 0.1s, box-shadow 0.1s, background 0.2s;
}
#playPauseBtn:active {
  transform: scale(0.9);
}
#playPauseBtn.paused {
  background: linear-gradient(135deg,
    rgba(200,150,40,0.9), rgba(150,100,20,0.95));
  color: #fff;
  box-shadow: 0 0 14px rgba(232,184,74,0.6);
}
#playPauseBtn svg { display: block; }

/* ===== انتخاب‌گر مپ ===== */
#mapSelector {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  left: 50%;
  transform: translateX(-50%);
  display: none;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg,
    rgba(30,26,18,0.88), rgba(20,16,10,0.92));
  border: 1px solid rgba(232,184,74,0.45);
  border-radius: 12px;
  z-index: 22;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 18px rgba(0,0,0,0.55);
  max-width: 280px;
}
#mapSelector.show {
  display: flex;
}
#mapLabel {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: 700;
  color: #c4a878;
  letter-spacing: 2px;
  text-align: center;
}
#mapOptions {
  display: flex;
  gap: 6px;
}
.mapOption {
  padding: 6px 10px;
  background: rgba(40,30,20,0.8);
  border: 1px solid rgba(232,184,74,0.35);
  border-radius: 6px;
  color: #c4a878;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.mapOption.active {
  background: linear-gradient(135deg, #8a6535, #5a4520);
  color: #f5e6c0;
  border-color: #e8b84a;
  box-shadow: 0 0 8px rgba(232,184,74,0.5);
}
.mapOption:active {
  transform: scale(0.95);
}
  /* ===== منوی Pause ===== */
#pauseMenu {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(10, 8, 5, 0.88);
  z-index: 90;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease-out;
}
#pauseMenu.show {
  display: flex;
}
#pauseTitle {
  font-family: 'Courier New', monospace;
  font-size: 42px;
  font-weight: 900;
  color: #e8b84a;
  letter-spacing: 8px;
  text-shadow:
    0 0 20px rgba(232,184,74,0.9),
    0 0 40px rgba(232,184,74,0.5);
  margin-bottom: 8px;
}
#pauseSubtitle {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #c4a878;
  letter-spacing: 4px;
  opacity: 0.7;
  margin-bottom: 20px;
}
#mapLabel {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #c4a878;
  letter-spacing: 3px;
  margin-bottom: 6px;
}
#mapOptions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.mapOption {
  padding: 12px 20px;
  background: rgba(40,30,20,0.9);
  border: 1px solid rgba(232,184,74,0.35);
  border-radius: 8px;
  color: #c4a878;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.mapOption.active {
  background: linear-gradient(135deg, #8a6535, #5a4520);
  color: #f5e6c0;
  border-color: #e8b84a;
  box-shadow: 0 0 12px rgba(232,184,74,0.6);
}
.mapOption:active {
  transform: scale(0.95);
}
#resumeButton {
  padding: 14px 50px;
  background: linear-gradient(135deg, #3a7a3a, #1a4a1a);
  border: 2px solid rgba(100, 200, 100, 0.6);
  border-radius: 8px;
  color: #d0ffd0;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 3px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(58, 122, 58, 0.6);
  transition: transform 0.1s, box-shadow 0.2s;
}
#resumeButton:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(58, 122, 58, 0.8);
}

/* ===== دکمه Play/Pause ===== */
#playPauseBtn {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 14px);
  right: calc(env(safe-area-inset-right, 0px) + 200px);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,
    rgba(30,26,18,0.85), rgba(20,16,10,0.9));
  border: 1px solid rgba(232,184,74,0.5);
  color: #e8b84a;
  z-index: 25;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 14px rgba(0,0,0,0.5);
  transition: transform 0.1s, box-shadow 0.1s, background 0.2s;
}
#playPauseBtn:active {
  transform: scale(0.9);
}
#playPauseBtn.paused {
  background: linear-gradient(135deg,
    rgba(200,150,40,0.9), rgba(150,100,20,0.95));
  color: #fff;
  box-shadow: 0 0 14px rgba(232,184,74,0.6);
}
#playPauseBtn svg { display: block; }
/* ===== iframe سایت Life Lands روی بیلبورد ===== */
#siteIframeContainer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
  display: none;
}

#siteIframeContainer.active {
  display: block;
}

#siteIframe {
  position: absolute;
  border: 3px solid #00d4ff;
  border-radius: 6px;
  background: #000;
  box-shadow:
    0 0 30px rgba(0, 212, 255, 0.7),
    0 0 60px rgba(0, 212, 255, 0.3);
  pointer-events: auto;
  transition: opacity 0.3s ease;
  display: block;
}
`;
