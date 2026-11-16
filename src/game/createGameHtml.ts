import { gameMarkup } from "./presentation/markup";
import { diagnosticsScript } from "./bridge/diagnostics";
import { hudScript } from "./presentation/hud";
import { createBootstrapScript } from "./application/bootstrap";
import { gameConfig } from "./config/gameConfig";
import { styles } from "./presentation/styles";
import { worldScript } from "./runtime/world";
import { physicsScript } from "./runtime/physics/physics";
import { controlsScript } from "./runtime/input/controls";
import { combatScript } from "./runtime/combat";
import { engineScript } from "./runtime/engine/engine";

export function createGameHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <style>${styles}</style>
</head>
<body>
${gameMarkup}
  <script>
${diagnosticsScript}${hudScript}    ${worldScript}
    ${physicsScript}
    ${controlsScript}
    ${combatScript}
    ${engineScript}

${createBootstrapScript(gameConfig)}
  </script>
  <script
    src="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"
    onload="window.startGame()"
    onerror="reportError('Could not load Three.js.')">
  </script>
</body>
</html>`;
}
