import * as THREE from "three";
import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import "./TechStack.css";

/* ------------------------------------------------------------------ */
/*  YOUR SKILLS                                                        */
/*  To add a skill: drop a logo in /public/images and add one line.    */
/*  Groups show in the order listed in GROUP_ORDER.                    */
/* ------------------------------------------------------------------ */
type Skill = { name: string; group: string; image: string };

const SKILLS: Skill[] = [
  { name: "React", group: "Frontend", image: "/images/react.webp" },
  { name: "HTML", group: "Frontend", image: "/images/html.webp" },
  { name: "CSS", group: "Frontend", image: "/images/css.webp" },
  { name: "Node.js", group: "Backend", image: "/images/nodejs.webp" },
  { name: "JavaScript", group: "Languages", image: "/images/javascript.webp" },
  { name: "MongoDB", group: "Databases", image: "/images/mongodb.webp" },
  { name: "Git", group: "Tools", image: "/images/git.webp" },
  { name: "Vercel", group: "Tools", image: "/images/vercel.webp" },
];

const GROUP_ORDER = ["Frontend", "Backend", "Languages", "Databases", "Tools"];

const GROUPS = GROUP_ORDER.map((name) => ({
  name,
  items: SKILLS.map((skill, index) => ({ skill, index })).filter((o) => o.skill.group === name),
})).filter((g) => g.items.length > 0);

const textureLoader = new THREE.TextureLoader();
const textures = SKILLS.map((s) => textureLoader.load(s.image));

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);

/* 30 spheres in the playground. The first SKILLS.length of them (one per
   skill) are the ones that line up in the "At a glance" view; the rest
   shrink away and come back when you return to the playground. */
const spheres = [...Array(30)].map((_, i) => ({
  scale: [0.7, 1, 0.8, 1, 1][Math.floor(Math.random() * 5)],
  skillIndex: i % SKILLS.length,
  primary: i < SKILLS.length,
}));

type Mode = "playground" | "sorted";
type SkillTarget = { x: number; y: number; scale: number };

/* Rapier body types (RigidBodyType enum values) */
const DYNAMIC = 0;
const KINEMATIC_POSITION = 2;

/* ------------------------------------------------------------------ */
/*  Layout for the sorted view, in world units                         */
/*  vw / vh = visible width and height at the plane the spheres sit on */
/* ------------------------------------------------------------------ */
function buildLayout(vw: number, vh: number) {
  const targets: SkillTarget[] = new Array(SKILLS.length);
  const headers: { name: string; x: number; y: number }[] = [];

  if (vw / vh >= 1.2) {
    /* wide screens: one column per group, spheres stacked under the title */
    const G = GROUPS.length;
    const colW = Math.min(vw / G, 5.4);
    const scale = Math.min(1, colW * 0.3);
    const gap = scale * 2 + 1; // sphere + room for its name
    const maxItems = Math.max(...GROUPS.map((g) => g.items.length));
    const total = 1.3 + (maxItems - 1) * gap + scale * 2 + 0.9;
    const headerY = total / 2 - 0.3;

    GROUPS.forEach((g, gi) => {
      const x = (gi - (G - 1) / 2) * colW;
      headers.push({ name: g.name, x, y: headerY });
      g.items.forEach((o, k) => {
        targets[o.index] = { x, y: headerY - 1.3 - scale - k * gap, scale };
      });
    });
  } else {
    /* phones: two columns of groups, spheres side by side under each title */
    const cols = 2;
    const rows = Math.ceil(GROUPS.length / cols);
    const cellW = vw / cols;
    const cellH = vh / rows;
    const scale = Math.min(0.6, cellW * 0.11);

    GROUPS.forEach((g, gi) => {
      const row = Math.floor(gi / cols);
      const inRow = Math.min(cols, GROUPS.length - row * cols);
      const cx = ((gi % cols) - (inRow - 1) / 2) * cellW;
      const top = vh / 2 - row * cellH;
      const spacing = Math.min(scale * 2 + 0.5, cellW / g.items.length);

      headers.push({ name: g.name, x: cx, y: top - 0.4 });
      g.items.forEach((o, k) => {
        targets[o.index] = {
          x: cx + (k - (g.items.length - 1) / 2) * spacing,
          y: top - 0.9 - scale,
          scale,
        };
      });
    });
  }

  return { targets, headers };
}

/* ------------------------------------------------------------------ */
/*  One sphere                                                         */
/* ------------------------------------------------------------------ */
type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshPhysicalMaterial;
  isActive: boolean;
  sorted: boolean;
  target?: SkillTarget; // set only for the sphere that represents a skill in the sorted view
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
  sorted,
  target,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const shown = useRef(scale); // animated visual scale
  const parked = useRef(false); // true while an extra sphere is switched off
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const identity = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_state, rawDelta) => {
    const body = api.current;
    if (!isActive || !body) return;
    const delta = Math.min(0.1, rawDelta);

    /* grow or shrink toward the size this mode wants */
    const goal = sorted ? (target ? target.scale : 0) : scale;
    shown.current = THREE.MathUtils.damp(shown.current, goal, 6, delta);
    if (mesh.current) {
      mesh.current.scale.setScalar(Math.max(shown.current, 0.0001));
      mesh.current.visible = shown.current > 0.02;
    }

    /* ---------- AT A GLANCE ---------- */
    if (sorted) {
      if (target) {
        // glide to the slot and turn the logo toward the camera
        if (body.bodyType() !== KINEMATIC_POSITION) body.setBodyType(KINEMATIC_POSITION, true);
        const k = 1 - Math.exp(-5 * delta);
        const p = body.translation();
        body.setNextKinematicTranslation({
          x: p.x + (target.x - p.x) * k,
          y: p.y + (target.y - p.y) * k,
          z: p.z + (0 - p.z) * k,
        });
        const q = body.rotation();
        tmpQ.set(q.x, q.y, q.z, q.w).slerp(identity, k);
        body.setNextKinematicRotation(tmpQ);
      } else if (shown.current < 0.03 && !parked.current) {
        body.setEnabled(false); // extra sphere has shrunk away
        parked.current = true;
      }
      return;
    }

    /* ---------- PLAYGROUND ---------- */
    if (parked.current) {
      // bring an extra sphere back from below the scene
      body.setEnabled(true);
      parked.current = false;
      body.setTranslation({ x: r(20), y: r(20) - 25, z: r(20) - 10 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    if (body.bodyType() !== DYNAMIC) {
      // a sorted sphere drops back into the pile with a little scatter
      body.setBodyType(DYNAMIC, true);
      body.applyImpulse({ x: r(4) * scale, y: r(4) * scale, z: r(4) * scale }, true);
    }

    const impulse = vec
      .copy(body.translation())
      .normalize()
      .multiply(new THREE.Vector3(-50 * delta * scale, -150 * delta * scale, -50 * delta * scale));
    body.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={[r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      {/* -90deg on Y points the logo at the camera when the body is not rotated */}
      <mesh
        ref={mesh}
        castShadow
        receiveShadow
        scale={scale}
        geometry={sphereGeometry}
        material={material}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) {
      // keep the cursor ball out of the way (sorted view / off screen)
      ref.current?.setNextKinematicTranslation({ x: 100, y: 100, z: 100 });
      return;
    }
    const targetVec = vec.lerp(
      new THREE.Vector3((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0),
      0.2
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody position={[100, 100, 100]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

/* ------------------------------------------------------------------ */
/*  Everything inside the Canvas                                       */
/* ------------------------------------------------------------------ */
type SceneProps = {
  mode: Mode;
  isActive: boolean;
  isVisible: boolean;
  materials: THREE.MeshPhysicalMaterial[];
};

function Scene({ mode, isActive, isVisible, materials }: SceneProps) {
  const viewport = useThree((s) => s.viewport);
  const layout = useMemo(
    () => buildLayout(viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );
  const sorted = mode === "sorted";
  const labelClass = `tech-label ${sorted ? "is-on" : ""}`;

  return (
    <>
      <ambientLight intensity={0.65} />
      <spotLight
        position={[20, 20, 25]}
        intensity={0.8}
        penumbra={1}
        angle={0.2}
        color="white"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[0, 5, -4]} intensity={1.3} />

      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]} paused={!isVisible}>
          <Pointer isActive={isActive && isVisible && !sorted} />
          {spheres.map((s, i) => (
            <SphereGeo
              key={i}
              scale={s.scale}
              material={materials[s.skillIndex]}
              isActive={isActive && isVisible}
              sorted={sorted}
              target={s.primary ? layout.targets[s.skillIndex] : undefined}
            />
          ))}
        </Physics>

        {/* group titles and skill names, shown in the sorted view */}
        {layout.headers.map((h) => (
          <Html
            key={h.name}
            position={[h.x, h.y, 0]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className={`${labelClass} tech-group`}>{h.name}</div>
          </Html>
        ))}
        {SKILLS.map((s, i) => {
          const t = layout.targets[i];
          return (
            <Html
              key={s.name}
              position={[t.x, t.y - t.scale - 0.5, 0]}
              center
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div className={`${labelClass} tech-name`}>{s.name}</div>
            </Html>
          );
        })}

        <Environment
          files="/models/char_enviorment.hdr"
          environmentIntensity={0.5}
          environmentRotation={[0, 4, 2]}
        />
        <EffectComposer enableNormalPass={false}>
          <N8AO color="#0f002c" aoRadius={2} intensity={1.15} />
        </EffectComposer>
      </Suspense>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */
// Change this to match the id of the section that should trigger the
// simulation (e.g. your "Skills" or "Tech Stack" section).
const TRIGGER_SECTION_ID = "skills";

const TechStack = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<Mode>("playground"); // set to "sorted" to open on the clear view
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return (
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.documentElement.classList.contains("dark")
      );
    }
    return false;
  });

  useEffect(() => {
    const updateTheme = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.documentElement.classList.contains("dark");
      setIsDarkTheme(isDark);
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    window.addEventListener("themechange", updateTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener("themechange", updateTheme);
    };
  }, []);

  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setIsVisible(visible);
        setIsActive(visible);
      },
      { rootMargin: "400px 0px 400px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const materials = useMemo(() => {
    return textures.map(
      (texture) =>
        new THREE.MeshPhysicalMaterial({
          map: texture,
          color: "#e8e8e8",
          emissive: "#ffffff",
          emissiveMap: texture,
          emissiveIntensity: 0.1,
          metalness: 0.15,
          roughness: 0.8,
          clearcoat: 0.2,
          clearcoatRoughness: 0.2,
        })
    );
  }, []);

  return (
    <div className="techstack" id={TRIGGER_SECTION_ID} ref={sectionRef}>
      <div className="section-watermark-heading">
        <span className="watermark-bg" aria-hidden="true">SKILLS</span>
        <h2 className="watermark-fg">SKILLS</h2>
      </div>

      <div className="tech-toggle" role="group" aria-label="Choose how to view my skills">
        <button
          type="button"
          className={mode === "playground" ? "is-active" : ""}
          aria-pressed={mode === "playground"}
          onClick={() => setMode("playground")}
        >
          Playground
        </button>
        <button
          type="button"
          className={mode === "sorted" ? "is-active" : ""}
          aria-pressed={mode === "sorted"}
          onClick={() => setMode("sorted")}
        >
          At a glance
        </button>
      </div>

      <div
        ref={canvasContainerRef}
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          justifyContent: "center",
          touchAction: "pan-y",
        }}
      >
        <Canvas
          shadows
          frameloop={isVisible ? "always" : "demand"}
          gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
          camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
          onCreated={(state) => (state.gl.toneMappingExposure = 1.0)}
          className="tech-canvas"
        >
          <Scene mode={mode} isActive={isActive} isVisible={isVisible} materials={materials} />
        </Canvas>
      </div>

      {/* plain-text copy of the skills: readable by recruiters' tools, screen readers and slow phones */}
      <ul className="tech-chips" aria-label="Skills by category">
        {GROUPS.map((g) => (
          <li key={g.name}>
            <strong>{g.name}</strong>
            <span>{g.items.map((o) => o.skill.name).join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TechStack;
