export const hostSimulationScript = String.raw`
function createHostSimulation(world, config) {
  const STEP = 1 / 60;
  const INPUT_TIMEOUT_MS = 300;

  let accumulator = 0;
  let snapshotSequence = 0;
  let lastProcessedInput = 0;
  let finished = false;
  const THREE = window.THREE;
  const raycaster = new THREE.Raycaster();
  const shotDirection = new THREE.Vector3();
  const shotOrigin = new THREE.Vector3();
  const hitPoint = new THREE.Vector3();
  const hitBox = new THREE.Box3();
  const COOLDOWN_MS = 150;
  const DAMAGE = 25;
  const RANGE = 60;
  const SCORE_PER_HIT = 10;
  const SCORE_PER_KILL = 50;

  function neutralInput() {
    return {
      moveX: 0,
      moveZ: 0,
      yaw: 0,
      pitch: 0,
      jump: false,
      fire: false
    };
  }

  function createPlayer(id) {
    const position = {
      x: 0,
      y: config.player.eyeHeight,
      z: 0
    };

    const rotation = { x: 0, y: 0 };

    // فیزیک فعلی camera.position و camera.rotation را می‌خواند.
    // این دوربین مجازی مستقل از دوربین واقعی نمایش است.
    const physicsWorld = {
      bounds: world.bounds,
      obstacles: world.obstacles,
      camera: {
        position: position,
        rotation: rotation
      }
    };

    return {
      id: id,
      position: position,
      rotation: rotation,
      physics: createPhysics(physicsWorld, config),
      health: 100,
      shots: 0,
      hits: 0,
      kills: 0,
      score: 0,
      killCredited: false,
      lastShotAt: -Infinity,
      input: neutralInput(),
      receivedAt: -Infinity,
      sequence: 0
    };
  }

  const host = createPlayer("host");
  const guest = createPlayer("guest");

  function findSpawn(player, preferredX, preferredZ, other) {
    function acceptable(x, z) {
      if (!player.physics.canStandAt(x, z)) return false;

      if (other) {
        const distance = Math.hypot(
          x - other.position.x,
          z - other.position.z
        );

        if (distance < Math.max(2, config.player.radius * 2)) {
          return false;
        }
      }

      return true;
    }

    if (acceptable(preferredX, preferredZ)) {
      player.position.x = preferredX;
      player.position.z = preferredZ;
      return;
    }

    const bounds = world.bounds;
    const margin = config.player.radius + 0.1;

    // جست‌وجوی قطعی؛ انتخاب محل Spawn به Math.random وابسته نیست.
    for (
      let z = bounds.minZ + margin;
      z <= bounds.maxZ - margin;
      z += 0.5
    ) {
      for (
        let x = bounds.minX + margin;
        x <= bounds.maxX - margin;
        x += 0.5
      ) {
        if (!acceptable(x, z)) continue;

        player.position.x = x;
        player.position.z = z;
        return;
      }
    }

    throw new Error("No valid multiplayer spawn point.");
  }

  findSpawn(
    host,
    world.camera.position.x,
    world.camera.position.z,
    null
  );

  findSpawn(
    guest,
    host.position.x + 3,
    host.position.z,
    host
  );

  function finite(value, fallback) {
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeInput(input) {
    let x = clamp(finite(input.moveX, 0), -1, 1);
    let z = clamp(finite(input.moveZ, 0), -1, 1);

    // حرکت مورب نباید سریع‌تر از حرکت مستقیم باشد.
    const length = Math.hypot(x, z);

    if (length > 1) {
      x /= length;
      z /= length;
    }

    const yaw = finite(input.yaw, 0);

    return {
      moveX: x,
      moveZ: z,
      yaw: Math.atan2(Math.sin(yaw), Math.cos(yaw)),
      pitch: clamp(
        finite(input.pitch, 0),
        -config.camera.maxPitch,
        config.camera.maxPitch
      ),
      jump: input.jump === true,
      fire: input.fire === true
    };
  }

  function setInput(id, input, sequence, now) {
    if (id !== "host" && id !== "guest") return false;
    if (!input || typeof input !== "object") return false;
    if (!Number.isFinite(now)) return false;

    const player = id === "host" ? host : guest;

    if (
      !Number.isSafeInteger(sequence) ||
      sequence <= player.sequence
    ) {
      return false;
    }

    player.input = normalizeInput(input);
    player.sequence = sequence;
    player.receivedAt = now;

    return true;
  }

  function stepPlayer(player, now) {
    const input = player.input;

    player.rotation.y = input.yaw;
    player.rotation.x = input.pitch;

    // اگر پیام‌ها متوقف شدند، بازیکن نباید با آخرین ورودی
    // برای همیشه به حرکت ادامه بدهد.
    const fresh = now - player.receivedAt <= INPUT_TIMEOUT_MS;

    player.physics.move({
      x: fresh ? input.moveX : 0,
      y: fresh ? input.moveZ : 0
    }, STEP);

    // پرش در این مرحله فعال نیست.
  }

  function shoot(player, target, now) {
    if (player.health <= 0 || !player.input.fire ||
        now - player.receivedAt > INPUT_TIMEOUT_MS ||
        now - player.lastShotAt < COOLDOWN_MS) return 0;

    player.lastShotAt = now;
    player.shots += 1;
    shotOrigin.set(player.position.x, player.position.y, player.position.z);
    const yaw = player.rotation.y;
    const pitch = player.rotation.x;
    shotDirection.set(-Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    raycaster.set(shotOrigin, shotDirection);
    raycaster.far = RANGE;

    // هیت‌باکس ساده متناسب با مدل؛ ارتفاع‌ها نسبت به کف هستند.
    const floor = target.position.y - config.player.eyeHeight;
    hitBox.min.set(target.position.x - 0.3, floor + 0.175, target.position.z - 0.3);
    hitBox.max.set(target.position.x + 0.3, floor + 1.73, target.position.z + 0.3);
    if (!raycaster.ray.intersectBox(hitBox, hitPoint)) return 0;
    const distance = shotOrigin.distanceTo(hitPoint);
    if (distance > RANGE) return 0;

    // دیوارها و اشیای نقشه جلوی تیر را می‌گیرند؛ دشمن تک‌نفره حذف است.
    world.scene.updateMatrixWorld(true);
    const blockers = world.shootables.filter(function (object) {
      if (object === world.target) return false;
      if ((world.enemies || []).some(function (enemy) {
        return enemy.group === object;
      })) return false;
      for (let node = object; node; node = node.parent) {
        if (!node.visible) return false;
      }
      return true;
    });
    const walls = raycaster.intersectObjects(blockers, true);
    if (walls.length && walls[0].distance <= distance) return 0;
    player.hits += 1;
    player.score += SCORE_PER_HIT;
    return DAMAGE;
  }

  function advance(deltaSeconds, now) {
    if (
      !Number.isFinite(deltaSeconds) ||
      !Number.isFinite(now)
    ) {
      return;
    }

    if (finished) return;
    // وقفهٔ طولانی یا برگشت از پس‌زمینه باعث جهش بازیکن نشود.
    accumulator += clamp(deltaSeconds, 0, 0.1);

    while (accumulator >= STEP) {
      stepPlayer(host, now);
      stepPlayer(guest, now);

      // ارزیابی هر دو تیر پیش از اعمال آسیب؛ بدون اولویت دادن به میزبان.
      const guestDamage = shoot(host, guest, now);
      const hostDamage = shoot(guest, host, now);
      host.health = Math.max(0, host.health - hostDamage);
      guest.health = Math.max(0, guest.health - guestDamage);

      // ثبت kill: هر بازیکن که حریف را به صفر رسانده، یک kill و پاداش می‌گیرد.
      if (guestDamage > 0 && guest.health === 0 && !guest.killCredited) {
        host.kills += 1;
        host.score += SCORE_PER_KILL;
        guest.killCredited = true;
      }
      if (hostDamage > 0 && host.health === 0 && !host.killCredited) {
        guest.kills += 1;
        guest.score += SCORE_PER_KILL;
        host.killCredited = true;
      }

      finished = host.health === 0 || guest.health === 0;

      lastProcessedInput = guest.sequence;
      accumulator -= STEP;
      if (finished) { accumulator = 0; break; }
    }
  }

  function serialize(player) {
    return {
      id: player.id,
      position: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z
      },
      yaw: player.rotation.y,
      pitch: player.rotation.x,
      health: player.health,
      shots: player.shots,
      hits: player.hits,
      kills: player.kills,
      score: player.score
    };
  }

  function snapshot(matchId) {
    snapshotSequence += 1;

    return {
      type: "game/snapshot",
      payload: {
        matchId: matchId,
        sequence: snapshotSequence,
        lastProcessedInput: lastProcessedInput,
        players: [
          serialize(host),
          serialize(guest)
        ]
      }
    };
  }

  return {
    setInput: setInput,
    advance: advance,
    snapshot: snapshot
  };
}
`;
