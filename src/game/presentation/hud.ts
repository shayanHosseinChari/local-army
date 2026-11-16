/** Source fragment: assembled in order; shares its parent factory scope. */
export const hudScript = `    window.gameStats = { kills: 0, shots: 0, score: 0 };

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

`;
