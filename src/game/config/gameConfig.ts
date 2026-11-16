import { singleShotSoundBase64 } from "../assets/audio/singleShot";

export const gameConfig = {
  player: { speed: 4.2, radius: 0.3, eyeHeight: 1.7 },
  camera: { fov: 70, sensitivity: 0.004, maxPitch: Math.PI / 2 - 0.1 },
  graphics: { maxPixelRatio: 1.5 },
  weapon: {
    bulletSpeed: 60, // سرعت گلوله دشمن (m/s)
    recoilStrength: 0.004, // شدت recoil دوربین
    headshotMultiplier: 2,
    cooldownMs: 20,
    respawnMs: 300,
    pointsPerHit: 100,
    autoFireIntervalMs: 100,
    maps: {
      current: "desert", // 'desert' | 'urban' | 'snow'
    },
    singleShotSoundBase64:
      singleShotSoundBase64,
    autoFireSoundBase64: "",
    // ولوم صدا (۰ تا ۱)
    shotSoundVolume: 0.8,
  },
};

export type GameConfig = typeof gameConfig;
