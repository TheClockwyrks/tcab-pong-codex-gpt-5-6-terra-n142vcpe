import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly theta: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly obstacleClock: number;
  readonly obstacleClockRunning: boolean;
  readonly simTime: number;
  readonly muted: boolean;
}
type Rect = { x: number; y: number; w: number; h: number };
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, a: number, b: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, q: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, q: Side, v: number): CaromState;
  setPaddleDriven(s: DeepReadonly<CaromState>, q: Side, v: boolean): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setObstacleClock(s: DeepReadonly<CaromState>, v: number): CaromState;
  setObstacleClockRunning(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): object;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): Rect | null;
}
export const BACKGROUND = "#07131f";
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const serveSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const pose = (i: number, t: number): ObstacleState => {
  const p = C.OBSTACLE_CENTERS[i],
    a =
      C.OBSTACLE_SWAY_AMP *
      Math.sin((2 * Math.PI * t) / C.OBSTACLE_SWAY_PERIOD);
  return {
    index: i,
    cx: p.x,
    cy: p.y + (i ? a * -1 : a),
    theta: C.OBSTACLE_SPIN_RATE * t,
  };
};
const os = (t: number) => [pose(0, t), pose(1, t)];
const newBall = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: serveSign(),
  trail: [],
});
const initial = (muted = false, simTime = 0, titleIndex = 0): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: titleIndex,
  titleIndex,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: newBall(),
  obstacles: os(0),
  obstacleClock: 0,
  obstacleClockRunning: true,
  simTime,
  muted,
});
const cp = (s: DeepReadonly<CaromState>): CaromState => ({
  ...s,
  score: { ...s.score },
  paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
  ai: { ...s.ai },
  ball: s.ball && { ...s.ball, trail: [...s.ball.trail] },
  obstacles: s.obstacles.map((o) => ({ ...o })),
});
const mustBall = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw Error("Carom: no ball in the field");
  return s.ball;
};
const rect = (s: DeepReadonly<CaromState>, i: number): Rect | null => {
  const n =
    s.screen === "title"
      ? 3
      : s.screen === "paused"
        ? 3
        : s.screen === "matchover"
          ? 2
          : s.screen === "howto"
            ? 1
            : 0;
  return i >= 0 && i < n ? { x: 430, y: 330 + i * 58, w: 420, h: 46 } : null;
};
const resetTitle = (s: DeepReadonly<CaromState>) =>
  initial(s.muted, s.simTime, s.titleIndex);
const match = (s: CaromState, mode = s.mode): CaromState => ({
  ...s,
  mode,
  screen: "countdown",
  resumeScreen: "playing",
  menuIndex: 0,
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  paddles: {
    left: { ...s.paddles.left, cy: C.FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: C.FIELD_CY, vy: 0 },
  },
  ball: newBall(),
  obstacleClock: 0,
  obstacleClockRunning: true,
  obstacles: os(0),
});
const move = (
  p: DeepReadonly<PaddleState>,
  vy: number,
  dt: number,
): PaddleState => {
  const cy = clamp(p.cy + vy * dt, C.PADDLE_MIN_CY, C.PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: cy !== p.cy + vy * dt && dt > 0 ? (cy - p.cy) / dt : vy,
  };
};
function paddles(s: CaromState, a: UpdateApi, dt: number) {
  const one = (side: Side): PaddleState => {
    const p = s.paddles[side];
    if (p.driven) return move(p, p.drivenVy, dt);
    if (side === "left" || s.mode === "versus") {
      const prefix = side === "left" ? "p1" : "p2";
      return move(
        p,
        (a.input.value(prefix + "-down") - a.input.value(prefix + "-up")) *
          C.PADDLE_SPEED,
        dt,
      );
    }
    if (!s.ai.movement) return move(p, 0, dt);
    const track = !!(
        s.ai.tracking &&
        s.screen === "playing" &&
        s.ball &&
        s.ball.vx > 0
      ),
      target = track ? s.ball!.y - s.ball!.vy * C.AI_REACT : C.AI_HOME_Y,
      d = target - p.cy,
      dead = track ? C.AI_DEADZONE : C.AI_HOME_DEADZONE;
    return move(
      p,
      Math.abs(d) <= dead || dt <= 0
        ? 0
        : Math.sign(d) * Math.min(C.AI_SPEED, Math.abs(d) / dt),
      dt,
    );
  };
  return { ...s, paddles: { left: one("left"), right: one("right") } };
}
function collideObstacle(b: BallState, o: ObstacleState) {
  const c = Math.cos(o.theta),
    z = Math.sin(o.theta),
    dx = b.x - o.cx,
    dy = b.y - o.cy,
    lx = dx * c + dy * z,
    ly = -dx * z + dy * c,
    qx = clamp(lx, -C.OBSTACLE_HW, C.OBSTACLE_HW),
    qy = clamp(ly, -C.OBSTACLE_HH, C.OBSTACLE_HH);
  let nx = lx - qx,
    ny = ly - qy,
    d = Math.hypot(nx, ny);
  if (d >= C.BALL_R) return null;
  if (!d) {
    if (C.OBSTACLE_HW - Math.abs(lx) < C.OBSTACLE_HH - Math.abs(ly)) {
      nx = lx >= 0 ? 1 : -1;
      ny = 0;
    } else {
      nx = 0;
      ny = ly >= 0 ? 1 : -1;
    }
    d = 1;
  }
  nx /= d;
  ny /= d;
  const x = nx * c - ny * z,
    y = nx * z + ny * c,
    dot = b.vx * x + b.vy * y;
  return {
    ...b,
    x: o.cx + (qx + nx * C.BALL_R) * c - (qy + ny * C.BALL_R) * z,
    y: o.cy + (qx + nx * C.BALL_R) * z + (qy + ny * C.BALL_R) * c,
    vx: dot < 0 ? b.vx - 2 * dot * x : b.vx,
    vy: dot < 0 ? b.vy - 2 * dot * y : b.vy,
  };
}
function sim(s: CaromState, a: UpdateApi, dt: number): CaromState {
  if (!s.ball) return s;
  let b = { ...s.ball };
  if (b.held) {
    const timer = b.holdTimer - dt;
    if (timer <= 0) {
      const d = s.receiver === "left" ? -1 : 1;
      return {
        ...s,
        screen: "playing",
        ball: {
          ...b,
          held: false,
          holdTimer: 0,
          vx: d * C.SERVE_SPEED * Math.cos(C.SERVE_ANGLE),
          vy: b.serveSign * C.SERVE_SPEED * Math.sin(C.SERVE_ANGLE),
          trail: [],
        },
      };
    }
    return {
      ...s,
      ball: {
        ...b,
        holdTimer: timer,
        trail: [
          ...b.trail.filter((v) => v.t >= s.simTime - C.TRAIL_TIME),
          { x: b.x, y: b.y, t: s.simTime },
        ],
      },
    };
  }
  const n = Math.max(
      1,
      Math.ceil((Math.hypot(b.vx, b.vy) * dt) / C.MAX_SUBSTEP),
    ),
    h = dt / n;
  for (let i = 0; i < n; i++) {
    const speed = Math.hypot(b.vx, b.vy),
      r = speed ? (b.spin / speed) * h : 0,
      co = Math.cos(r),
      si = Math.sin(r);
    b = {
      ...b,
      vx: b.vx * co - b.vy * si,
      vy: b.vx * si + b.vy * co,
      spin: b.spin * 0.5 ** (h / C.SPIN_HALFLIFE),
      x: b.x + (b.vx * co - b.vy * si) * h,
      y: b.y + (b.vx * si + b.vy * co) * h,
    };
    if (b.y - C.BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: C.BALL_R, vy: -b.vy };
      a.audio.play(C.CUES.wallBounce);
    } else if (b.y + C.BALL_R > C.FIELD_H && b.vy > 0) {
      b = { ...b, y: C.FIELD_H - C.BALL_R, vy: -b.vy };
      a.audio.play(C.CUES.wallBounce);
    }
    for (const side of ["left", "right"] as const) {
      const p = s.paddles[side],
        x0 = side === "left" ? C.P1_X0 : C.P2_X0,
        x1 = side === "left" ? C.P1_X1 : C.P2_X1;
      if (!(
        b.x > x0 - C.BALL_R &&
        b.x < x1 + C.BALL_R &&
        b.y > p.cy - C.PADDLE_HALF - C.BALL_R &&
        b.y < p.cy + C.PADDLE_HALF + C.BALL_R
      ))
        continue;
      const ds: [string, number][] = [
          ["l", b.x - (x0 - C.BALL_R)],
          ["r", x1 + C.BALL_R - b.x],
          ["t", b.y - (p.cy - C.PADDLE_HALF - C.BALL_R)],
          ["b", p.cy + C.PADDLE_HALF + C.BALL_R - b.y],
        ],
        f = ds.reduce((q, v) => (v[1] < q[1] ? v : q))[0];
      if (f === "l" || f === "r") {
        const angle =
            clamp((b.y - p.cy) / C.PADDLE_HALF, -1, 1) * C.MAX_BOUNCE_ANGLE,
          sp = Math.min(Math.hypot(b.vx, b.vy) * C.SPEED_MULT, C.SPEED_CAP),
          d = side === "left" ? 1 : -1;
        b = {
          ...b,
          x: side === "left" ? C.P1_X1 + C.BALL_R : C.P2_X0 - C.BALL_R,
          vx: d * sp * Math.cos(angle),
          vy: sp * Math.sin(angle),
          spin: clamp(
            b.spin + p.vy * C.SPIN_FROM_PADDLE,
            -C.SPIN_CLAMP,
            C.SPIN_CLAMP,
          ),
        };
        a.audio.play(C.CUES.paddleHit);
      } else {
        b = {
          ...b,
          y:
            f === "t"
              ? p.cy - C.PADDLE_HALF - C.BALL_R
              : p.cy + C.PADDLE_HALF + C.BALL_R,
          vy: (f === "t" && b.vy > 0) || (f === "b" && b.vy < 0) ? -b.vy : b.vy,
        };
        a.audio.play(C.CUES.wallBounce);
      }
    }
    for (const o of s.obstacles) {
      const q = collideObstacle(b, o);
      if (q) {
        b = q;
        a.audio.play(C.CUES.obstacleBounce);
      }
    }
  }
  if (b.x - C.BALL_R > C.FIELD_W || b.x + C.BALL_R < 0) {
    const p1 = b.x - C.BALL_R > C.FIELD_W,
      score = { p1: s.score.p1 + (p1 ? 1 : 0), p2: s.score.p2 + (p1 ? 0 : 1) },
      winner: Side | null =
        score.p1 >= C.WIN_SCORE && score.p1 - score.p2 >= C.WIN_LEAD
          ? "left"
          : score.p2 >= C.WIN_SCORE && score.p2 - score.p1 >= C.WIN_LEAD
            ? "right"
            : null;
    a.audio.play(C.CUES.score);
    if (winner)
      return {
        ...s,
        score,
        winner,
        screen: "matchover",
        menuIndex: 0,
        ball: b,
      };
    return {
      ...s,
      score,
      receiver: p1 ? "right" : "left",
      screen: "countdown",
      ball: newBall(),
    };
  }
  return {
    ...s,
    ball: {
      ...b,
      trail: [
        ...b.trail.filter((v) => v.t >= s.simTime - C.TRAIL_TIME),
        { x: b.x, y: b.y, t: s.simTime },
      ],
    },
  };
}
const debug: CaromDebugApi = {
  version: C.CAROM_DEBUG_VERSION,
  clearWorld: (s) => ({ ...cp(s), ball: null, obstacles: [] }),
  spawnBall: (s) => ({ ...cp(s), ball: newBall() }),
  spawnObstacle: (s, i) => {
    if (i < 0 || i > 1) throw Error("Carom: obstacle index");
    const n = cp(s);
    return {
      ...n,
      obstacles: [
        ...n.obstacles.filter((o) => o.index !== i),
        pose(i, n.obstacleClock),
      ].sort((a, b) => a.index - b.index),
    };
  },
  reset: (s) => initial(s.muted),
  reconcile: (s) => ({
    ...cp(s),
    obstacles: s.obstacles.map((o) => pose(o.index, s.obstacleClock)),
  }),
  setScreen: (s, v) => ({ ...cp(s), screen: v }),
  setMode: (s, v) => ({ ...cp(s), mode: v }),
  setMenuIndex: (s, v) => ({ ...cp(s), menuIndex: v }),
  setTitleIndex: (s, v) => ({ ...cp(s), titleIndex: v }),
  setResumeScreen: (s, v) => ({ ...cp(s), resumeScreen: v }),
  setScore: (s, p1, p2) => ({ ...cp(s), score: { p1, p2 } }),
  setWinner: (s, v) => ({ ...cp(s), winner: v }),
  setReceiver: (s, v) => ({ ...cp(s), receiver: v }),
  setPaddleCy: (s, q, v) => ({
    ...cp(s),
    paddles: { ...s.paddles, [q]: { ...s.paddles[q], cy: v } },
  }),
  setPaddleVy: (s, q, v) => ({
    ...cp(s),
    paddles: { ...s.paddles, [q]: { ...s.paddles[q], drivenVy: v } },
  }),
  setPaddleDriven: (s, q, v) => ({
    ...cp(s),
    paddles: { ...s.paddles, [q]: { ...s.paddles[q], driven: v } },
  }),
  setBallPosition: (s, x, y) => ({ ...cp(s), ball: { ...mustBall(s), x, y } }),
  setBallVelocity: (s, x, y) => ({
    ...cp(s),
    ball: { ...mustBall(s), vx: x, vy: y },
  }),
  setBallSpin: (s, v) => ({ ...cp(s), ball: { ...mustBall(s), spin: v } }),
  setBallHeld: (s, v) => ({ ...cp(s), ball: { ...mustBall(s), held: v } }),
  setBallHoldTimer: (s, v) => ({
    ...cp(s),
    ball: { ...mustBall(s), holdTimer: v },
  }),
  setBallServeSign: (s, v) => ({
    ...cp(s),
    ball: { ...mustBall(s), serveSign: v },
  }),
  drawBallServeSign: (s) => ({
    ...cp(s),
    ball: { ...mustBall(s), serveSign: serveSign() },
  }),
  setAiTracking: (s, v) => ({ ...cp(s), ai: { ...s.ai, tracking: v } }),
  setAiMovement: (s, v) => ({ ...cp(s), ai: { ...s.ai, movement: v } }),
  setMuted: (s, v) => ({ ...cp(s), muted: v }),
  setObstacleClock: (s, v) => ({
    ...cp(s),
    obstacleClock: v,
    obstacles: s.obstacles.map((o) => pose(o.index, v)),
  }),
  setObstacleClockRunning: (s, v) => ({ ...cp(s), obstacleClockRunning: v }),
  snapshot: (s) => ({
    ...cp(s),
    version: C.CAROM_DEBUG_VERSION,
    ball: s.ball && { ...s.ball, speed: Math.hypot(s.ball.vx, s.ball.vy) },
  }),
  menuItemRect: rect,
};
function menu(s: CaromState, a: UpdateApi): CaromState {
  let n = s;
  if (
    s.screen === "title" ||
    s.screen === "paused" ||
    s.screen === "matchover"
  ) {
    const count = s.screen === "matchover" ? 2 : 3;
    if (a.input.pressed("p1-up") || a.input.pressed("p2-up"))
      n = { ...n, menuIndex: (n.menuIndex + count - 1) % count };
    else if (a.input.pressed("p1-down") || a.input.pressed("p2-down"))
      n = { ...n, menuIndex: (n.menuIndex + 1) % count };
    else if (a.input.pressed("confirm")) return confirm(n);
  }
  if (
    s.screen === "howto" &&
    (a.input.pressed("confirm") || a.input.pressed("back"))
  )
    return resetTitle(n);
  const p = a.input.pointer(),
    r = Array.from({ length: 4 }, (_, i) => rect(n, i)).findIndex(
      (x) =>
        x && p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h,
    );
  if (r >= 0) n = { ...n, menuIndex: r };
  if (r >= 0 && a.input.pointerReleased() && a.input.pointerPressed())
    return confirm(n);
  return n;
}
function confirm(s: CaromState): CaromState {
  if (s.screen === "title") {
    const n = { ...s, titleIndex: s.menuIndex };
    return n.menuIndex === 0
      ? match(n, "solo")
      : n.menuIndex === 1
        ? match(n, "versus")
        : { ...n, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...s, screen: s.resumeScreen }
      : s.menuIndex === 1
        ? match(s)
        : resetTitle(s);
  if (s.screen === "matchover")
    return s.menuIndex === 0 ? match(s) : resetTitle(s);
  return s;
}
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    for (const x of C.ACTIONS)
      api.input.register(x, { keys: [...C.BINDINGS[x]] });
    api.audio.define(C.CUES.paddleHit, {
      wave: "square",
      freq: 560,
      freqTo: 340,
      gain: 0.12,
      durationMs: 55,
    });
    api.audio.define(C.CUES.wallBounce, {
      wave: "triangle",
      freq: 260,
      freqTo: 180,
      gain: 0.1,
      durationMs: 45,
    });
    api.audio.define(C.CUES.obstacleBounce, {
      wave: "sawtooth",
      freq: 420,
      freqTo: 220,
      gain: 0.08,
      durationMs: 60,
    });
    api.audio.define(C.CUES.score, {
      wave: "square",
      freq: 740,
      freqTo: 980,
      gain: 0.14,
      durationMs: 130,
    });
    for (const [name, get] of [
      ["screen", (s: DeepReadonly<CaromState>) => s.screen],
      ["mode", (s: DeepReadonly<CaromState>) => s.mode],
      [
        "score",
        (s: DeepReadonly<CaromState>) => s.score.p1 + " - " + s.score.p2,
      ],
      [
        "ball",
        (s: DeepReadonly<CaromState>) =>
          s.ball ? s.ball.x.toFixed(0) + ", " + s.ball.y.toFixed(0) : "none",
      ],
      [
        "velocity",
        (s: DeepReadonly<CaromState>) =>
          s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0,
      ],
      ["spin", (s: DeepReadonly<CaromState>) => (s.ball ? s.ball.spin : 0)],
      [
        "left paddle",
        (s: DeepReadonly<CaromState>) =>
          s.paddles.left.cy.toFixed(0) + " / " + s.paddles.left.vy.toFixed(0),
      ],
      [
        "right paddle",
        (s: DeepReadonly<CaromState>) =>
          s.paddles.right.cy.toFixed(0) + " / " + s.paddles.right.vy.toFixed(0),
      ],
    ] as const)
      api.diagnostics.register(name, get);
    return [initial(), debug];
  },
  update(state, a, dt) {
    let s = cp(state);
    if (a.input.pressed("mute")) {
      a.audio.setMuted(!a.audio.muted());
      s = { ...s, muted: a.audio.muted() };
    } else s = { ...s, muted: a.audio.muted() };
    if (s.screen === "countdown" || s.screen === "playing") {
      if (a.input.pressed("pause"))
        return {
          ...s,
          screen: "paused",
          resumeScreen: s.screen,
          menuIndex: 0,
          simTime: s.simTime + dt,
        };
      s = paddles(s, a, dt);
      s = sim(s, a, dt);
      const clock = s.obstacleClockRunning
        ? s.obstacleClock + dt
        : s.obstacleClock;
      s = {
        ...s,
        obstacleClock: clock,
        obstacles: s.obstacles.map((o) => pose(o.index, clock)),
      };
    } else if (s.screen === "paused") {
      if (a.input.pressed("pause") || a.input.pressed("back"))
        s = { ...s, screen: s.resumeScreen };
      else s = menu(s, a);
    } else s = menu(s, a);
    return { ...s, simTime: s.simTime + dt };
  },
  render(s, a) {
    draw(s, a.ctx);
  },
};
function draw(s: DeepReadonly<CaromState>, x: CanvasRenderingContext2D) {
  x.fillStyle = BACKGROUND;
  x.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  x.strokeStyle = "#173850";
  x.lineWidth = 2;
  x.strokeRect(16, 16, C.FIELD_W - 32, C.FIELD_H - 32);
  x.setLineDash([10, 12]);
  x.strokeStyle = "#35627a";
  x.beginPath();
  x.moveTo(C.NET_X, 30);
  x.lineTo(C.NET_X, C.FIELD_H - 30);
  x.stroke();
  x.setLineDash([]);
  for (const o of s.obstacles) {
    x.save();
    x.translate(o.cx, o.cy);
    x.rotate(o.theta);
    x.fillStyle = "#f5ae4d";
    x.shadowColor = "#f5ae4d";
    x.shadowBlur = 18;
    x.fillRect(-10, -70, 20, 140);
    x.restore();
  }
  for (const [side, p] of [
    ["left", s.paddles.left],
    ["right", s.paddles.right],
  ] as const) {
    x.fillStyle = side === "left" ? "#3ed3e0" : "#ec5d98";
    x.shadowColor = x.fillStyle;
    x.shadowBlur = 18;
    x.fillRect(
      side === "left" ? C.P1_X0 : C.P2_X0,
      p.cy - C.PADDLE_HALF,
      16,
      110,
    );
  }
  x.shadowBlur = 0;
  if (s.ball) {
    x.strokeStyle = "rgba(213,248,255,.55)";
    x.lineWidth = 5;
    x.beginPath();
    for (const q of s.ball.trail) {
      x.lineTo(q.x, q.y);
    }
    x.lineTo(s.ball.x, s.ball.y);
    x.stroke();
    x.fillStyle = "#f7fbff";
    x.shadowColor = "#9feeff";
    x.shadowBlur = 24;
    x.beginPath();
    x.arc(s.ball.x, s.ball.y, C.BALL_R, 0, Math.PI * 2);
    x.fill();
    x.shadowBlur = 0;
  }
  if (
    s.screen === "playing" ||
    s.screen === "countdown" ||
    s.screen === "paused" ||
    s.screen === "matchover"
  ) {
    x.fillStyle = "#cce8f6";
    x.font = "700 48px system-ui";
    x.textAlign = "center";
    x.fillText(String(s.score.p1), 520, 75);
    x.fillText(String(s.score.p2), 760, 75);
    x.font = "600 14px system-ui";
    x.fillStyle = "#79a7bc";
    x.fillText(
      s.mode === "solo" ? "SOLO // CURVE THE RALLY" : "VERSUS // LOCAL DUEL",
      640,
      105,
    );
    if (s.screen === "countdown") {
      x.font = "700 28px system-ui";
      x.fillStyle = "#f5ae4d";
      x.fillText("SERVE IN " + Math.ceil(s.ball?.holdTimer || 0), 640, 650);
    }
  }
  if (s.screen === "title") {
    x.font = "900 106px system-ui";
    x.textAlign = "center";
    x.fillStyle = "#eafaff";
    x.fillText(C.TITLE_TEXT, 640, 245);
    x.font = "500 17px system-ui";
    x.fillStyle = "#79a7bc";
    x.fillText("A SPIN-DRIVEN PADDLE DUEL", 640, 278);
  }
  if (s.screen === "howto") {
    x.textAlign = "center";
    x.fillStyle = "#eafaff";
    x.font = "800 42px system-ui";
    x.fillText("HOW TO PLAY", 640, 210);
    x.font = "20px system-ui";
    x.fillStyle = "#a9c6d5";
    [
      "W / S move the cyan paddle",
      "Arrow keys also control you in Solo",
      "Paddle motion bends the ball's flight",
      "Bank shots around the moving amber bars",
    ].forEach((t, i) => x.fillText(t, 640, 275 + i * 38));
  }
  if (s.screen === "matchover") {
    x.textAlign = "center";
    x.fillStyle = "#eafaff";
    x.font = "800 46px system-ui";
    x.fillText((s.winner === "left" ? "CYAN" : "PINK") + " WINS", 640, 245);
  }
  if (["title", "paused", "matchover", "howto"].includes(s.screen)) {
    if (s.screen === "paused") {
      x.fillStyle = "rgba(3,10,17,.68)";
      x.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
      x.textAlign = "center";
      x.font = "800 42px system-ui";
      x.fillStyle = "#eafaff";
      x.fillText("PAUSED", 640, 250);
    }
    const items =
      s.screen === "title"
        ? C.TITLE_ITEMS
        : s.screen === "paused"
          ? C.PAUSE_ITEMS
          : s.screen === "matchover"
            ? C.MATCHOVER_ITEMS
            : ["BACK"];
    const offset =
      s.screen === "title"
        ? 0
        : s.screen === "paused"
          ? 0
          : s.screen === "matchover"
            ? 0
            : 90;
    items.forEach((item, i) => {
      const r = { x: 430, y: 330 + i * 58 + offset, w: 420, h: 46 },
        active = s.menuIndex === i;
      x.fillStyle = active ? "#e8b14d" : "#143149";
      x.fillRect(r.x, r.y, r.w, r.h);
      x.fillStyle = active ? "#07131f" : "#cce8f6";
      x.font = "700 19px system-ui";
      x.textAlign = "center";
      x.fillText(item, 640, r.y + 30);
    });
  }
}
