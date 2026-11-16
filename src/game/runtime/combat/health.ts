/** Source fragment: assembled in order; shares its parent factory scope. */
export const health = String.raw`  // ===== سلامت =====
  const MAX_HEALTH = 100;
  let health = MAX_HEALTH;
  const healthFill = document.getElementById('healthFill');
  const healthCurrent = document.getElementById('healthCurrent');
  const damageOverlay = document.getElementById('damageOverlay');
  const gameOverEl = document.getElementById('gameOver');

  function updateHealthUI() {
    if (!healthFill) return;
    const pct = Math.max(0, health) / MAX_HEALTH;
    const circumference = 2 * Math.PI * 42;
    healthFill.style.strokeDashoffset = circumference * (1 - pct);

    healthFill.classList.remove('warning', 'danger');
    const bar = document.getElementById('healthBar');
    if (bar) bar.classList.remove('danger', 'warning');

    if (pct < 0.3) {
      healthFill.classList.add('danger');
      if (bar) bar.classList.add('danger');
    } else if (pct < 0.6) {
      healthFill.classList.add('warning');
      if (bar) bar.classList.add('warning');
    }

    if (healthCurrent) healthCurrent.textContent = Math.max(0, Math.round(health));
  }

  function takeDamage(amount) {
    if (gameOver) return;
    health -= amount;
    updateHealthUI();
    if (damageOverlay) {
      damageOverlay.classList.remove('hit');
      void damageOverlay.offsetWidth;
      damageOverlay.classList.add('hit');
    }
    if (health <= 0) triggerGameOver();
  }

  function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    health = 0;
    updateHealthUI();
    enabled = false;
    firing = false;
    stopAutoFire();
    if (world.gun && world.gun.setAiming) world.gun.setAiming(false);
    if (gameOverEl) {
      document.getElementById('finalKills').textContent = window.gameStats ? window.gameStats.kills : 0;
      document.getElementById('finalScore').textContent = window.gameStats ? window.gameStats.score : 0;
      gameOverEl.classList.add('show');
    }
  }

  window.applyPlayerDamage = function(amount) {
    if (!gameOver) takeDamage(amount);
  };

  const restartBtn = document.getElementById('restartButton');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      health = MAX_HEALTH;
      gameOver = false;
      enabled = true;
      updateHealthUI();
      if (gameOverEl) gameOverEl.classList.remove('show');
      if (window.gameStats) {
        window.gameStats.kills = 0;
        window.gameStats.shots = 0;
        window.gameStats.score = 0;
        if (window.setKillCount) window.setKillCount(0);
        if (window.setShotCount) window.setShotCount(0);
        if (window.setScore) window.setScore(0);
      }
    });
  }

  updateHealthUI();

`;
