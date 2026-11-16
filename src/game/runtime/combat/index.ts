import { state } from "./state";
import { health } from "./health";
import { audio } from "./audio";
import { effects } from "./effects";
import { shooting } from "./shooting";
import { inputAndLifecycle } from "./inputAndLifecycle";

/** Order and shared lexical scope are part of the runtime contract. */
export const combatScript = [
  state,
  health,
  audio,
  effects,
  shooting,
  inputAndLifecycle,
].join("");
