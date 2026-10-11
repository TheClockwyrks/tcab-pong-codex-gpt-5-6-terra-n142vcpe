import { describe, expect, it } from "vitest";
import { game, type CaromDebugApi, type CaromState } from "./game";

const initApi = {
  input: { register: () => {}, layout: () => null },
  audio: { define: () => {}, load: async () => {} },
  assets: {
    loadImage: async () => new ImageBitmap(),
    loadAudio: async () => new AudioBuffer({ length: 1, sampleRate: 1 }),
    load: async () => new Blob(),
    resolve: () => "",
  },
  diagnostics: { register: () => {} },
  events: { on: () => () => {} },
  viewport: () => ({
    width: 1280,
    height: 720,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }),
};
const updateApi = {
  input: {
    value: () => 0,
    pressed: () => false,
    pointer: () => ({
      x: 0,
      y: 0,
      down: false,
      device: "mouse" as const,
      buttons: [],
    }),
    pointerPressed: () => false,
    pointerReleased: () => false,
    pointerSamples: () => [],
    pointerContacts: () => [],
    wheel: () => ({ x: 0, y: 0 }),
  },
  audio: {
    play: () => {},
    loop: () => {},
    stop: () => {},
    looping: () => false,
    setMuted: () => {},
    muted: () => false,
  },
  frame: () => ({ count: 0, timeMs: 0, lastDeltaMs: 0 }),
  viewport: () => ({
    width: 1280,
    height: 720,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }),
};

describe("Carom simulation", () => {
  it("serves a parked ball through the real countdown", () => {
    const [state, debug] = game.initialize(initApi as never) as [
      CaromState,
      CaromDebugApi,
    ];
    const ready = debug.setScreen(
      debug.setBallHoldTimer(state, 0),
      "countdown",
    );
    const next = game.update(ready, updateApi, 1 / 60);
    expect(next.screen).toBe("playing");
    expect(next.ball?.held).toBe(false);
    expect(Math.hypot(next.ball?.vx ?? 0, next.ball?.vy ?? 0)).toBeCloseTo(520);
  });

  it("poses and reads the debug world without mutating the original", () => {
    const [state, debug] = game.initialize(initApi as never) as [
      CaromState,
      CaromDebugApi,
    ];
    const posed = debug.setPaddleCy(state, "left", 222);
    expect(state.paddles.left.cy).toBe(360);
    expect(debug.snapshot(posed)).toMatchObject({
      paddles: { left: { cy: 222 } },
    });
  });
});
