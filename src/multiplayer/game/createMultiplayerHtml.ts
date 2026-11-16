import { createGameHtml } from "../../game/createGameHtml";
import { createBootstrapScript } from "../../game/application/bootstrap";
import { gameConfig } from "../../game/config/gameConfig";

import type { MatchSession } from "../protocol/matchProtocol";

import { hostSimulationScript } from "./hostSimulation";
import { multiplayerRuntimeScript } from "./multiplayerRunTime";

export function createMultiplayerHtml(session: MatchSession): string {
  const sessionJson = JSON.stringify(session).replace(/</g, "\\u003c");
  const configJson = JSON.stringify(gameConfig).replace(/</g, "\\u003c");

  const multiplayerBootstrap = `
    ${hostSimulationScript}
    ${multiplayerRuntimeScript}

    (function () {
      const session = ${sessionJson};

      let initialized = false;
      let runtime = null;

      function post(type, extra) {
        if (!window.ReactNativeWebView) return;

        window.ReactNativeWebView.postMessage(JSON.stringify(
          Object.assign({
            type: type,
            matchId: session.matchId
          }, extra || {})
        ));
      }

      window.lanBridge = {
        start: function (matchId) {
          if (
            matchId !== session.matchId ||
            !runtime
          ) {
            return;
          }

          runtime.start();
        },

        receive: function (message) {
          if (runtime) runtime.receive(message);
        }
      };

      window.startGame = function () {
        if (initialized) return;
        initialized = true;

        try {
          if (!window.THREE) {
            throw new Error("Three.js is unavailable.");
          }

          const config = ${configJson};

          config.maps = { current: "desert" };

          runtime = createMultiplayerRuntime(
            session,
            config,
            post
          );

          post("multiplayer/loaded");
        } catch (error) {
          if (runtime) {
            try { runtime.dispose(); } catch (_) {}
          }

          post("multiplayer/error", {
            message: error instanceof Error
              ? error.message
              : String(error)
          });
        }
      };

      window.addEventListener("pagehide", function () {
        if (runtime) runtime.dispose();
      });
    })();
  `;

  const html = createGameHtml();
  const originalBootstrap = createBootstrapScript(gameConfig);

  if (!html.includes(originalBootstrap)) {
    throw new Error("Game bootstrap changed; update createMultiplayerHtml.");
  }

  return html.replace(originalBootstrap, () => multiplayerBootstrap);
}
