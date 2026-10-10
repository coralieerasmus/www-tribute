"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./apple.module.css";

/**
 * Floating 3D laptop rendered with three.js.
 * Put your model at /public/models/macbook.glb.
 *
 * If the laptop faces the wrong way, tweak BASE_ROTATION (radians).
 */
export const MODEL_URL = "/models/macbook.glb";
const BASE_ROTATION = { x: 0.55, y: -0.45, z: 0.18 };
const MODEL_SIZE = 3.1; // the model is scaled so its biggest side is this many units

export default function LaptopScene({ tint, spinKey }: { tint: string; spinKey: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef(tint);
  const spinRef = useRef({ key: spinKey, start: -1 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    tintRef.current = tint;
  }, [tint]);

  useEffect(() => {
    if (spinRef.current.key !== spinKey) spinRef.current = { key: spinKey, start: performance.now() };
  }, [spinKey]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;

        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0, 9);

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 5, 6);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xbfd4ff, 1.4);
        rim.position.set(-5, 2, -4);
        scene.add(rim);

        const pivot = new THREE.Group();
        scene.add(pivot);

        const materials: InstanceType<typeof THREE.MeshStandardMaterial>[] = [];
        const loader = new GLTFLoader();
        loader.load(
          MODEL_URL,
          (gltf) => {
            if (disposed) return;
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            const holder = new THREE.Group();
            holder.add(model);
            holder.scale.setScalar(MODEL_SIZE / Math.max(size.x, size.y, size.z));
            pivot.add(holder);
            model.traverse((o) => {
              const mesh = o as InstanceType<typeof THREE.Mesh>;
              if (!mesh.isMesh) return;
              const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              list.forEach((m) => {
                if ((m as InstanceType<typeof THREE.MeshStandardMaterial>).isMeshStandardMaterial) {
                  const sm = m as InstanceType<typeof THREE.MeshStandardMaterial>;
                  sm.envMapIntensity = 1.1;
                  materials.push(sm);
                }
              });
            });
            setStatus("ready");
          },
          (e) => {
            if (e.total) setProgress(e.loaded / e.total);
          },
          () => setStatus("error"),
        );

        // interaction state
        const pointer = { x: 0, y: 0 };
        const smooth = { x: 0, y: 0, scroll: 0 };
        const onPointer = (e: PointerEvent) => {
          pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
          pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener("pointermove", onPointer);

        const resize = () => {
          const w = mount.clientWidth;
          const h = mount.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / Math.max(1, h);
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(mount);
        resize();

        const tintColor = new THREE.Color();
        const clock = new THREE.Clock();
        let raf = 0;
        const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        const tick = () => {
          const t = clock.getElapsedTime();
          smooth.x += (pointer.x - smooth.x) * 0.05;
          smooth.y += (pointer.y - smooth.y) * 0.05;
          const scrollK = Math.min(1.5, window.scrollY / window.innerHeight);
          smooth.scroll += (scrollK - smooth.scroll) * 0.08;

          let spin = 0;
          const s = spinRef.current;
          if (s.start > 0) {
            const k = Math.min(1, (performance.now() - s.start) / 1100);
            spin = ease(k) * Math.PI * 2;
            if (k >= 1) s.start = -1;
          }

          pivot.rotation.set(
            BASE_ROTATION.x + smooth.y * 0.18 + smooth.scroll * 0.35,
            BASE_ROTATION.y + smooth.x * 0.4 + spin + smooth.scroll * 0.9,
            BASE_ROTATION.z + Math.sin(t * 0.6) * 0.03,
          );
          pivot.position.y = Math.sin(t * 1.1) * 0.08 + smooth.scroll * 0.6;

          tintColor.set(tintRef.current);
          materials.forEach((m) => m.color.lerp(tintColor, 0.08));

          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        tick();

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("pointermove", onPointer);
          ro.disconnect();
          scene.traverse((o) => {
            const mesh = o as InstanceType<typeof THREE.Mesh>;
            if (!mesh.isMesh) return;
            mesh.geometry?.dispose();
            const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            list.forEach((m) => {
              Object.values(m).forEach((v) => {
                if (v && typeof v === "object" && "isTexture" in v) (v as { dispose(): void }).dispose();
              });
              m.dispose();
            });
          });
          envTex.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
        if (disposed) cleanup();
      } catch (err) {
        console.error("LaptopScene failed to start", err);
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className={styles.sceneWrap}>
      <div className={styles.glow} />
      <div ref={mountRef} className={styles.scene} />
      {status === "loading" && (
        <div className={styles.sceneLoading}>
          <div className={styles.sceneBar}>
            <div style={{ width: `${Math.max(6, progress * 100)}%` }} />
          </div>
        </div>
      )}
      {status === "error" && <div className={styles.sceneError}>Add your model at public{MODEL_URL}</div>}
    </div>
  );
}
