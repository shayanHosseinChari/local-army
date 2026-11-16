import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

export function verify(load, html, baseline) {
  let count = 0;
  function test(name, run) { run(); count++; console.log('PASS', name); }
  const hash = text => createHash('sha256').update(text).digest('hex');
  test('HTML matches original byte-for-byte', () => assert.equal(hash(html), baseline.html));
  test('Config including embedded audio is unchanged', () => assert.equal(hash(JSON.stringify(load('config.js').gameConfig)), baseline.config));
  for (const name of ['world', 'combat', 'controls', 'engine', 'physics', 'enemies', 'styles']) {
    test(`${name}: compatibility export and original content`, () => {
      const value = load(`${name}.js`)[name === 'styles' ? name : `${name}Script`];
      assert.equal(hash(value), baseline[name]);
      if (name !== 'styles') new vm.Script(value);
    });
  }
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  test('Complete generated JavaScript parses', () => { new vm.Script(script); });
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { textContent: '', classList: { add() {}, remove() {} } });
    return elements.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: element },
    window: { addEventListener() {}, THREE: {} },
  });
  vm.runInContext(script, context);
  test('HUD updates kills, shots and score', () => {
    context.window.incrementKill(200); context.window.incrementShot();
    assert.equal(context.window.gameStats.kills, 1);
    assert.equal(context.window.gameStats.score, 200);
    assert.equal(context.window.gameStats.shots, 1);
    assert.equal(element('scoreCount').textContent, 200);
  });
  test('Bootstrap launches default map and disposes before switching', () => {
    const events = [];
    context.createWorld = (_, config) => { events.push(config.maps.current); return {}; };
    context.createPhysics = () => ({});
    context.createControls = () => ({});
    context.createCombat = () => ({});
    context.createEngine = () => ({ dispose() { events.push('dispose'); } });
    context.window.startGame();
    context.window.switchMap('urban');
    context.window.switchMap('snow');
    assert.deepEqual(events, ['desert', 'dispose', 'urban', 'dispose', 'snow']);
    assert.equal(context.window.gameStats.score, 0);
  });
  test('Physics respects obstacles, bounds and movement', () => {
    const sandbox = vm.createContext({});
    vm.runInContext(load('physics.js').physicsScript, sandbox);
    const world = { bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, obstacles: [{ minX: 2, maxX: 3, minZ: -1, maxZ: 1 }], camera: { rotation: { y: 0 }, position: { x: 0, z: 0 } } };
    const physics = sandbox.createPhysics(world, load('config.js').gameConfig);
    assert.equal(physics.canStandAt(2.5, 0), false);
    assert.equal(physics.canStandAt(10, 0), false);
    physics.move({ x: 1, y: 0 }, 1);
    assert.ok(world.camera.position.x > 0 && world.camera.position.x <= 1.7);
  });
  test('Engine pause/resume, frame updates and idempotent disposal', () => {
    const listeners = new Map();
    function target(prefix) { return {
      addEventListener(name, handler) { listeners.set(prefix + name, handler); },
      removeEventListener(name) { listeners.delete(prefix + name); },
    }; }
    let pending = null; let disposed = 0; let moved = 0; let rendered = 0;
    const sandbox = vm.createContext({
      document: { ...target('document:'), hidden: false, getElementById: () => null },
      window: target('window:'), performance: { now: () => 0 },
      requestAnimationFrame(fn) { pending = fn; return 1; },
      cancelAnimationFrame() { pending = null; },
      reportError(error) { throw error; },
    });
    vm.runInContext(load('engine.js').engineScript, sandbox);
    const world = { renderer: { domElement: target('canvas:'), render() { rendered++; } }, scene: {}, camera: {}, target: { rotation: { y: 0 } }, resize() {}, dispose() { disposed++; } };
    const engine = sandbox.createEngine(world, { input: {}, reset() {}, dispose() { disposed++; } }, { move(_, dt) { moved++; assert.equal(dt, 0.05); } }, { update() {}, setEnabled() {}, dispose() { disposed++; } }, () => {});
    assert.equal(typeof pending, 'function'); pending(100);
    assert.equal(moved, 1); assert.equal(rendered, 1);
    sandbox.window.togglePause(true); assert.equal(pending, null);
    sandbox.window.togglePause(false); assert.equal(typeof pending, 'function');
    engine.dispose(); engine.dispose();
    assert.equal(disposed, 3); assert.equal(pending, null); assert.equal(listeners.size, 0);
  });
  console.log(`\n${count} checks passed. WebGL, audio and native-device interaction still require device testing.`);
}
