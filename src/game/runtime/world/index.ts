import { sceneSetup } from "./sceneSetup";
import { terrain } from "./terrain";
import { billboard } from "./billboard";
import { landmarks } from "./landmarks";
import { enemies } from "./enemies";
import { vegetation } from "./vegetation";
import { weapon } from "./weapon";
import { lifecycle } from "./lifecycle";

/** Order and shared lexical scope are part of the runtime contract. */
export const worldScript = [
  sceneSetup,
  terrain,
  billboard,
  landmarks,
  enemies,
  vegetation,
  weapon,
  lifecycle,
].join("");
