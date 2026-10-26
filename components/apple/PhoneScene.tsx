"use client";

import { useEffect, useRef, type RefObject } from "react";
import type * as T from "three";
import { CLIPS } from "./feed";

/**
 * The 3D iPhone (three.js), drawn on a transparent full-window canvas.
 *
 * - In the store it sits exactly on top of an "anchor" element in the page
 *   (so it scrolls with the hero) and tilts with the mouse.
 * - In the finale it glides to the centre, its SCREEN starts playing your
 *   brainrot clips (with sound), and then it shrinks into the wall of screens.
 *
 * The screen of each model is found by material name, its UVs are rebuilt so
 * any picture fits it upright, and it gets a live canvas texture (lock screen
 * or the swiping feed). If anything fails, `onStatus("error")` is called and
 * the page keeps showing the CSS phone instead.
 */

export type PhoneModel = {
  url: string;
  /** material name of the display in the .glb */
  screenMaterial: string;
  /** materials that get recoloured by the colour swatches */
  bodyMaterials: string[];
  /** materials of the black border around the display (forced to glossy black) */
  bezelMaterials?: string[];
  /** black border drawn around the screen picture (fraction of the screen width), for models without a bezel */
  bezel?: number;
};

export type PhoneMode = "store" | "center" | "shrink" | "drift" | "hidden";

type Props = {
  model: PhoneModel;
  /** body colour, or null for the model's own colour */
  tint: string | null;
  /** 3 colours for the lock-screen wallpaper */
  wallpaper: [string, string, string];
  anchor: RefObject<HTMLElement | null>;
  mode: PhoneMode;
  /** true = the screen plays the feed instead of the lock screen */
  feed: boolean;
  /** phone height (px) in "center" mode */
  centerHeight: number;
  /** phone height (px) at the end of "shrink" */
  shrinkHeight: number;
  shrinkMs: number;
  /** "drift": the phone slowly (linearly) gets smaller, together with the wall behind it */
  driftHeight?: number;
  driftMs?: number;
  /** volume of the phone's own video sound (0–1) */
  volume?: number;
  zIndex: number;
  /** other models to load in the background, so switching is instant */
  preload?: PhoneModel[];
  onStatus?: (s: "loading" | "ready" | "error") => void;
};

type Prepared = {
  root: T.Group;
  /** fade the body to this colour (or jump there with `instant`) */
  setTint: (hex: string | null, instant?: boolean) => void;
  /** called every frame: moves the colour a bit closer to its target */
  update: (dt: number) => void;
};

const CANVAS_W = 540;
const CANVAS_H = 1170;
const CLIP_MS = 1800; // each clip on screen
const SWIPE_MS = 380;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function PhoneScene(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        propsRef.current.onStatus?.("loading");
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (disposed) return;

        /* ---------- renderer / scene ---------- */
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const key = new THREE.DirectionalLight(0xffffff, 2.0);
        key.position.set(3, 4, 6);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xbfd4ff, 1.2);
        rim.position.set(-4, 2, -3);
        scene.add(rim);

        const CAM_Z = 10;
        const FOV = 30;
        const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
        camera.position.set(0, 0, CAM_Z);

        const pivot = new THREE.Group();
        scene.add(pivot);

        /* ---------- the screen texture (2D canvas) ---------- */
        const screenCanvas = document.createElement("canvas");
        screenCanvas.width = CANVAS_W;
        screenCanvas.height = CANVAS_H;
        const g = screenCanvas.getContext("2d")!;
        const screenTex = new THREE.CanvasTexture(screenCanvas);
        screenTex.colorSpace = THREE.SRGBColorSpace;
        screenTex.anisotropy = 4;

        const drawBezel = () => {
          const b = propsRef.current.model.bezel ?? 0;
          if (!b) return;
          const w = b * CANVAS_W;
          const r = CANVAS_W * 0.13;
          g.save();
          g.beginPath();
          g.rect(0, 0, CANVAS_W, CANVAS_H);
          g.roundRect(w, w, CANVAS_W - 2 * w, CANVAS_H - 2 * w, r);
          g.fillStyle = "#000";
          g.fill("evenodd");
          g.restore();
        };

        let lockKey = "";
        const drawLock = (wp: [string, string, string]) => {
          const grad = g.createRadialGradient(CANVAS_W * 0.35, CANVAS_H * 0.2, 10, CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_H * 0.75);
          grad.addColorStop(0, wp[0]);
          grad.addColorStop(0.45, wp[1]);
          grad.addColorStop(1, wp[2]);
          g.fillStyle = grad;
          g.fillRect(0, 0, CANVAS_W, CANVAS_H);
          g.fillStyle = "rgba(255,255,255,0.9)";
          g.textAlign = "center";
          g.font = "600 32px -apple-system, 'SF Pro Display', Inter, Arial, sans-serif";
          g.fillText("Friday 23 October", CANVAS_W / 2, CANVAS_H * 0.2);
          g.fillStyle = "#fff";
          g.font = "700 168px -apple-system, 'SF Pro Display', Inter, Arial, sans-serif";
          g.fillText("9:41", CANVAS_W / 2, CANVAS_H * 0.2 + 175);
          g.fillStyle = "#fff";
          g.fillRect(CANVAS_W / 2 - 95, CANVAS_H - 40, 190, 9);
          drawBezel();
          screenTex.needsUpdate = true;
        };

        /* ---------- feed (real clips) ---------- */
        let videos: HTMLVideoElement[] = [];
        let feedStart = 0;
        let feedIdx = -1;
        const ensureVideos = () => {
          if (videos.length) return;
          videos = CLIPS.filter((c) => c.video).map((c, i) => {
            const v = document.createElement("video");
            v.src = c.video!;
            v.loop = true;
            v.muted = true;
            v.playsInline = true;
            // only the first few load straight away; the rest load just before their turn
            v.preload = i < 3 ? "auto" : "metadata";
            return v;
          });
          videos.slice(0, 2).forEach((v) => void v.play().catch(() => {}));
        };
        let feedVolume = 0.9;
        const playWithSound = (v: HTMLVideoElement) => {
          v.muted = false;
          v.volume = feedVolume;
          v.play().catch(() => {
            v.muted = true;
            void v.play().catch(() => {});
          });
        };
        const drawCover = (v: HTMLVideoElement, y: number) => {
          const vw = v.videoWidth || 9;
          const vh = v.videoHeight || 16;
          const s = Math.max(CANVAS_W / vw, CANVAS_H / vh);
          const w = vw * s;
          const h = vh * s;
          if (v.readyState >= 2) g.drawImage(v, (CANVAS_W - w) / 2, y + (CANVAS_H - h) / 2, w, h);
          else {
            g.fillStyle = "#111";
            g.fillRect(0, y, CANVAS_W, CANVAS_H);
          }
        };
        const drawFeed = (now: number) => {
          const n = videos.length;
          if (!n) return;
          const t = now - feedStart;
          const slot = Math.floor(t / CLIP_MS);
          const inSlot = t - slot * CLIP_MS;
          const cur = slot % n;
          const next = (slot + 1) % n;
          if (cur !== feedIdx) {
            videos.forEach((v, i) => {
              if (i !== cur && i !== next) {
                v.pause();
                v.muted = true;
              }
            });
            playWithSound(videos[cur]);
            videos[next].muted = true;
            void videos[next].play().catch(() => {});
            feedIdx = cur;
          }
          const swipeT = Math.max(0, inSlot - (CLIP_MS - SWIPE_MS)) / SWIPE_MS;
          const off = easeInOutCubic(Math.min(1, swipeT)) * CANVAS_H;
          g.fillStyle = "#000";
          g.fillRect(0, 0, CANVAS_W, CANVAS_H);
          drawCover(videos[cur], -off);
          if (off > 0) drawCover(videos[next], CANVAS_H - off);

          // UI on top
          const item = CLIPS[cur];
          const shade = g.createLinearGradient(0, CANVAS_H * 0.62, 0, CANVAS_H);
          shade.addColorStop(0, "rgba(0,0,0,0)");
          shade.addColorStop(1, "rgba(0,0,0,0.65)");
          g.fillStyle = shade;
          g.fillRect(0, CANVAS_H * 0.62, CANVAS_W, CANVAS_H * 0.38);
          g.textAlign = "left";
          g.fillStyle = "#fff";
          g.font = "700 30px -apple-system, Inter, Arial, sans-serif";
          g.fillText(item.user, 28, CANVAS_H - 120);
          g.font = "500 26px -apple-system, Inter, Arial, sans-serif";
          g.fillText(item.caption, 28, CANVAS_H - 82);
          g.textAlign = "center";
          g.font = "44px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
          const icons: [string, string][] = [
            ["❤️", item.likes],
            ["💬", "8.2K"],
            ["↗️", "Share"],
          ];
          icons.forEach(([ic, label], i) => {
            const y = CANVAS_H * 0.6 + i * 110;
            g.fillText(ic, CANVAS_W - 50, y);
            g.font = "700 20px -apple-system, Inter, Arial, sans-serif";
            g.fillText(label, CANVAS_W - 50, y + 34);
            g.font = "44px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
          });
          const v = videos[cur];
          const p = v.duration ? v.currentTime / v.duration : 0;
          g.fillStyle = "rgba(255,255,255,0.3)";
          g.fillRect(0, CANVAS_H - 30, CANVAS_W, 5);
          g.fillStyle = "#fff";
          g.fillRect(0, CANVAS_H - 30, CANVAS_W * p, 5);
          drawBezel();
          screenTex.needsUpdate = true;
        };

        /* ---------- loading + preparing a model ---------- */
        const loader = new GLTFLoader();
        const cache = new Map<string, Promise<Prepared>>();

        const prepare = async (m: PhoneModel): Promise<Prepared> => {
          const gltf = await loader.loadAsync(m.url);
          const raw = gltf.scene;
          raw.updateMatrixWorld(true);

          const screens: T.Mesh[] = [];
          const lenses: T.Mesh[] = [];
          raw.traverse((o) => {
            const mesh = o as T.Mesh;
            if (!mesh.isMesh) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            if (mats.some((mt) => mt.name === m.screenMaterial)) screens.push(mesh);
            if (mats.some((mt) => /lens|camera/i.test(mt.name))) lenses.push(mesh);
          });
          if (!screens.length) throw new Error(`No material called "${m.screenMaterial}" in ${m.url}`);

          // 1) turn the model so the screen faces the camera (+Z)
          const base = new THREE.Group();
          base.add(raw);
          const boxOf = (objs: T.Object3D[], root: T.Object3D) => {
            root.updateMatrixWorld(true);
            const b = new THREE.Box3();
            objs.forEach((o) => b.expandByObject(o));
            return b;
          };
          const mBox = boxOf([raw], base);
          const sBox = boxOf(screens, base);
          const sSize = sBox.getSize(new THREE.Vector3());
          const sC = sBox.getCenter(new THREE.Vector3());
          const mC = mBox.getCenter(new THREE.Vector3());
          const axis = sSize.x <= sSize.y && sSize.x <= sSize.z ? "x" : sSize.y <= sSize.z ? "y" : "z";
          const sign = Math.sign(sC[axis] - mC[axis]) || 1;
          if (axis === "z" && sign < 0) base.rotation.y = Math.PI;
          if (axis === "x") base.rotation.y = sign < 0 ? Math.PI / 2 : -Math.PI / 2;
          if (axis === "y") base.rotation.x = sign > 0 ? Math.PI / 2 : -Math.PI / 2;

          // 2) make it portrait and the right way up (camera bump at the top)
          const fix = new THREE.Group();
          fix.add(base);
          let s2 = boxOf(screens, fix).getSize(new THREE.Vector3());
          if (s2.x > s2.y) fix.rotation.z = Math.PI / 2;
          if (lenses.length) {
            const lensC = boxOf(lenses, fix).getCenter(new THREE.Vector3());
            const bodyC = boxOf([raw], fix).getCenter(new THREE.Vector3());
            if (lensC.y < bodyC.y) fix.rotation.z += Math.PI;
          }

          // 3) centre it and make it 1 unit tall
          const holder = new THREE.Group();
          holder.add(fix);
          const fullBox = boxOf([raw], holder);
          const size = fullBox.getSize(new THREE.Vector3());
          const center = fullBox.getCenter(new THREE.Vector3());
          fix.position.sub(center);
          holder.scale.setScalar(1 / size.y);
          holder.updateMatrixWorld(true);

          // 4) new UVs for the screen: straight from its position, so pictures are upright
          const scrBox = boxOf(screens, holder);
          s2 = scrBox.getSize(new THREE.Vector3());
          const v = new THREE.Vector3();
          screens.forEach((mesh) => {
            const geo = mesh.geometry.clone();
            const pos = geo.attributes.position;
            const uv = new Float32Array(pos.count * 2);
            for (let i = 0; i < pos.count; i++) {
              v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
              uv[i * 2] = (v.x - scrBox.min.x) / s2.x;
              uv[i * 2 + 1] = (v.y - scrBox.min.y) / s2.y;
            }
            geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
            mesh.geometry = geo;
            // DoubleSide: some models have the screen's faces pointing inwards
            mesh.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, side: THREE.DoubleSide });
            mesh.renderOrder = 1;
          });

          // 4b) hide the cover glass in front of the screen (it washes the screen out and flickers)
          const scrArea = s2.x * s2.y;
          const scrFront = scrBox.max.z;
          const mb = new THREE.Box3();
          raw.traverse((o) => {
            const mesh = o as T.Mesh;
            if (!mesh.isMesh || screens.includes(mesh)) return;
            mb.setFromObject(mesh);
            const ms = mb.getSize(new THREE.Vector3());
            const ix = Math.max(0, Math.min(mb.max.x, scrBox.max.x) - Math.max(mb.min.x, scrBox.min.x));
            const iy = Math.max(0, Math.min(mb.max.y, scrBox.max.y) - Math.max(mb.min.y, scrBox.min.y));
            const coversScreen = (ix * iy) / scrArea > 0.8;
            const thin = ms.z < s2.y * 0.03;
            const inFront = mb.max.z > scrFront && (mb.min.z + mb.max.z) / 2 >= (scrBox.min.z + scrBox.max.z) / 2;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const seeThrough = mats.some((mt) => mt.transparent || mt.opacity < 1);
            if (coversScreen && ((thin && inFront) || (seeThrough && mb.max.z > scrFront))) mesh.visible = false;
          });

          // 5) body colour + a truly black bezel
          const bezelMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
          const body: { mat: T.MeshStandardMaterial; orig: T.Color }[] = [];
          raw.traverse((o) => {
            const mesh = o as T.Mesh;
            if (!mesh.isMesh || screens.includes(mesh)) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const next = mats.map((mt) => {
              if (m.bezelMaterials?.includes(mt.name)) return bezelMat;
              if (!m.bodyMaterials.includes(mt.name)) return mt;
              const c = (mt as T.MeshStandardMaterial).clone();
              body.push({ mat: c, orig: c.color.clone() });
              return c;
            });
            mesh.material = Array.isArray(mesh.material) ? next : next[0];
          });

          const targets = body.map((b) => b.orig.clone());
          return {
            root: holder,
            setTint: (hex, instant) =>
              body.forEach((b, i) => {
                if (hex) targets[i].set(hex);
                else targets[i].copy(b.orig);
                if (instant) b.mat.color.copy(targets[i]);
              }),
            update: (dt) => {
              const k = 1 - Math.exp(-dt * 6); // smooth colour fade (~0.5s)
              body.forEach((b, i) => b.mat.color.lerp(targets[i], k));
            },
          };
        };
        const get = (m: PhoneModel) => {
          if (!cache.has(m.url)) cache.set(m.url, prepare(m));
          return cache.get(m.url)!;
        };

        let lastTint: string | null | undefined;

        /* ---------- swapping models ----------
         * Like a turntable: when you pick another model, the phone turns
         * smoothly; halfway through the first quarter turn (when it's edge-on
         * and you can't see it) the new model takes its place and finishes the turn.
         * The turn only starts once the new model is loaded AND warmed up on the
         * graphics card, so it never stutters. */
        const TURN_MS = 2800;
        let shown: Prepared | null = null;
        let shownUrl = "";
        let firstReady = false;
        let failed = false;
        const ready = new Map<string, Prepared>();
        let turn: { start: number; swapped: boolean } | null = null;

        /* Draw a model once, off-screen, so its textures and shaders are sent
           to the graphics card now and not in the middle of the spin
           (that upload was what made the turn hitch). */
        const warmTarget = new THREE.WebGLRenderTarget(8, 8);
        const warm = (p: Prepared) => {
          const prevParent = p.root.parent;
          scene.add(p.root);
          renderer.setRenderTarget(warmTarget);
          renderer.render(scene, camera);
          renderer.setRenderTarget(null);
          scene.remove(p.root);
          if (prevParent) prevParent.add(p.root);
        };
        const makeReady = (url: string, p: Prepared) => {
          if (ready.has(url)) return;
          warm(p);
          ready.set(url, p);
        };

        const load = (m: PhoneModel) => {
          get(m)
            .then((p) => makeReady(m.url, p))
            .catch((err) => {
              console.error("PhoneScene: could not load", m.url, err);
              if (!firstReady && !failed) {
                failed = true;
                propsRef.current.onStatus?.("error");
              }
            });
        };
        const show = (url: string) => {
          const p = ready.get(url)!;
          if (shown) pivot.remove(shown.root);
          pivot.add(p.root);
          shown = p;
          shownUrl = url;
          p.setTint(propsRef.current.tint, true);
          lastTint = propsRef.current.tint;
        };

        /** returns the extra rotation (radians) for this frame */
        const syncModel = (now: number) => {
          const m = propsRef.current.model;
          if (!ready.has(m.url)) {
            if (!cache.has(m.url)) load(m);
          }

          // very first model: just show it
          if (!firstReady) {
            if (ready.has(m.url)) {
              show(m.url);
              firstReady = true;
              propsRef.current.onStatus?.("ready");
              // warm up the other models one by one, so switching is instant
              (propsRef.current.preload ?? []).reduce<Promise<unknown>>(
                (chain, pm) =>
                  chain
                    .then(() => get(pm))
                    .then((p) => new Promise<void>((res) => setTimeout(() => (makeReady(pm.url, p), res()), 200)))
                    .catch(() => {}),
                Promise.resolve(),
              );
            }
            return 0;
          }

          if (!turn && m.url !== shownUrl && ready.has(m.url)) turn = { start: now, swapped: false };
          if (!turn) return 0;

          const k = Math.min(1, (now - turn.start) / TURN_MS);
          // ease in and out, like a slow turntable
          const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          const angle = Math.PI * 2 * e;
          if (!turn.swapped && angle >= Math.PI / 2) {
            const want = propsRef.current.model.url;
            if (ready.has(want) && want !== shownUrl) show(want);
            turn.swapped = true;
          }
          if (k >= 1) turn = null;
          return angle;
        };

        /* ---------- interaction ---------- */
        const pointer = { x: 0, y: 0 };
        const onPointer = (e: PointerEvent) => {
          pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
          pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener("pointermove", onPointer);

        let vw = 1;
        let vh = 1;
        const resize = () => {
          vw = window.innerWidth;
          vh = window.innerHeight;
          renderer.setSize(vw, vh, false);
          camera.aspect = vw / vh;
          camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", resize);
        resize();

        /* ---------- animation loop ---------- */
        const cur = { cx: vw / 2, cy: vh / 2, h: 400, rx: 0, ry: 0, op: 1 };
        let lastMode: PhoneMode | null = null;
        let shrinkStart = 0;
        let shrinkFrom = 0;
        let wasFeed = false;
        let raf = 0;
        let prev = performance.now();

        const tick = (now: number) => {
          const dt = Math.min(0.05, (now - prev) / 1000);
          prev = now;
          const p = propsRef.current;
          const spin = syncModel(now);

          // colour swatches (only once the right model is showing)
          if (shown && shownUrl === p.model.url && p.tint !== lastTint) {
            shown.setTint(p.tint);
            lastTint = p.tint;
          }
          (shown as Prepared | null)?.update(dt);

          // screen content
          if (p.feed) {
            if (!wasFeed) {
              ensureVideos();
              feedStart = now;
              feedIdx = -1;
              wasFeed = true;
            }
            drawFeed(now);
          } else {
            if (wasFeed) {
              videos.forEach((v) => v.pause());
              wasFeed = false;
              lockKey = "";
            }
            const k = p.wallpaper.join() + shownUrl;
            if (k !== lockKey && (shownUrl === p.model.url || !shown)) {
              drawLock(p.wallpaper);
              lockKey = k;
            }
          }

          // where should the phone be?
          if (p.mode !== lastMode) {
            if (p.mode === "shrink" || p.mode === "drift") {
              shrinkStart = now;
              shrinkFrom = cur.h;
            }
            lastMode = p.mode;
          }
          const t = now / 1000;
          const follow = 1 - Math.exp(-dt * 5);

          if (p.mode === "store") {
            const r = p.anchor.current?.getBoundingClientRect();
            if (r) {
              cur.cx = r.left + r.width / 2;
              cur.cy = r.top + r.height / 2 + Math.sin(t * 1.2) * 8;
              cur.h = r.height;
            }
            cur.ry += (pointer.x * 0.5 - cur.ry) * follow;
            cur.rx += (pointer.y * 0.18 - cur.rx) * follow;
            cur.op += (1 - cur.op) * follow;
          } else if (p.mode === "center") {
            cur.cx += (vw / 2 - cur.cx) * follow;
            cur.cy += (vh / 2 - cur.cy) * follow;
            cur.h += (p.centerHeight - cur.h) * follow;
            cur.ry += (Math.sin(t * 0.7) * 0.06 - cur.ry) * follow;
            cur.rx += (0 - cur.rx) * follow;
            cur.op += (1 - cur.op) * follow;
          } else if (p.mode === "shrink") {
            const k = easeInOutCubic(Math.min(1, (now - shrinkStart) / p.shrinkMs));
            cur.cx = vw / 2;
            cur.cy = vh / 2;
            cur.h = shrinkFrom + (p.shrinkHeight - shrinkFrom) * k;
            cur.ry += (0 - cur.ry) * follow;
            cur.rx += (0 - cur.rx) * follow;
          } else if (p.mode === "drift") {
            // linear, exactly like the CSS transition of the wall
            const k = Math.min(1, (now - shrinkStart) / (p.driftMs ?? 1));
            cur.cx = vw / 2;
            cur.cy = vh / 2;
            cur.h = shrinkFrom + ((p.driftHeight ?? shrinkFrom) - shrinkFrom) * k;
            cur.ry += (0 - cur.ry) * follow;
            cur.rx += (0 - cur.rx) * follow;
          } else {
            cur.op = 0;
            if (wasFeed) {
              videos.forEach((v) => v.pause());
              wasFeed = false;
            }
          }
          canvas.style.opacity = String(Math.max(0, Math.min(1, cur.op)));

          // the phone's own sound (fades smoothly when the volume prop changes)
          const wantVol = p.volume ?? 0.9;
          feedVolume += (wantVol - feedVolume) * (1 - Math.exp(-dt * 3));
          if (wasFeed && feedIdx >= 0 && videos[feedIdx]) videos[feedIdx].volume = Math.max(0, Math.min(1, feedVolume));

          const wpp = (2 * Math.tan(((FOV / 2) * Math.PI) / 180) * CAM_Z) / vh; // world units per pixel at z=0
          pivot.position.set((cur.cx - vw / 2) * wpp, -(cur.cy - vh / 2) * wpp, 0);
          pivot.scale.setScalar(Math.max(0.0001, cur.h * wpp));
          pivot.rotation.set(cur.rx, cur.ry + spin, 0);

          if (cur.op > 0.01) renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("pointermove", onPointer);
          window.removeEventListener("resize", resize);
          videos.forEach((v) => {
            v.pause();
            v.removeAttribute("src");
            v.load();
          });
          scene.traverse((o) => {
            const mesh = o as T.Mesh;
            if (!mesh.isMesh) return;
            mesh.geometry?.dispose();
          });
          screenTex.dispose();
          warmTarget.dispose();
          envTex.dispose();
          pmrem.dispose();
          renderer.dispose();
        };
        if (disposed) cleanup();
      } catch (err) {
        console.error("PhoneScene failed to start", err);
        if (!disposed) propsRef.current.onStatus?.("error");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: props.zIndex,
        pointerEvents: "none",
        transition: "opacity 0.25s",
      }}
    />
  );
}