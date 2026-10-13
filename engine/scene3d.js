/* VP3 — deterministic Three.js scenes for the VideoPremium engine.
 * Rule: every pixel is a pure function of (beat) — no clock, no Math.random(), no animation mixer, no rAF.
 * Load AFTER vendor/three.min.js and motion.js:
 *   <script src="../../engine/vendor/three.min.js"></script><script src="../../engine/scene3d.js"></script>
 * Usage:  const sc = VP3.make('orbit', {w, h, colors:['#FF7A45','#FFB547'], bg:'#000'});  sc.el (canvas)  sc.draw(k)  // k = beats since shot start
 */
(() => {
  const VP3 = {};
  const col = c => new THREE.Color(c);

  /* One renderer per scene; preserveDrawingBuffer so the screenshot reads the frame we just drew. */
  VP3.base = ({ w, h, bg = null, fov = 38 }) => {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: bg == null, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(); if (bg != null) scene.background = col(bg);
    const camera = new THREE.PerspectiveCamera(fov, w / h, .1, 100);
    return { canvas, renderer, scene, camera };
  };

  /* ---- presets (add more here; each returns {el, draw(k)}) ---- */
  const PRESETS = {
    /* Faceted gem/knot orbited by a camera, with a seeded particle field. Good as an opening or a hero beat. */
    orbit({ w, h, colors = ['#FF7A45', '#FFB547'], bg = '#000000', seed = 7, turns = .35, particles = 420 }) {
      const { canvas, renderer, scene, camera } = VP3.base({ w, h, bg });
      const A = col(colors[0]), Bc = col(colors[1]);
      const mat = new THREE.MeshStandardMaterial({ color: A, metalness: .85, roughness: .22, flatShading: true });
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1, .34, 220, 24, 2, 3), mat); scene.add(knot);
      const key = new THREE.PointLight(Bc, 60, 0, 2); key.position.set(3, 2.5, 4); scene.add(key);
      const rim = new THREE.PointLight(A, 40, 0, 2); rim.position.set(-4, -1.5, -2); scene.add(rim);
      scene.add(new THREE.AmbientLight(0xffffff, .35));
      const R = VP.rng(seed), pos = new Float32Array(particles * 3);
      for (let i = 0; i < particles; i++) { const r = 3 + R() * 6, a = R() * 6.2832, e = (R() - .5) * 5; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = e; pos[i * 3 + 2] = Math.sin(a) * r; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: Bc, size: .035, transparent: true, opacity: .8, depthWrite: false })); scene.add(pts);
      return {
        el: canvas,
        draw(k) {                                           // k = beats since shot start
          const s = VP.ease(VP.clamp(k / 6));               // slow settle across the first 6 beats
          const ang = (k * .12 + .4) * turns * Math.PI * 2 / 2;
          const dist = VP.lerp(11, 7.6, s);
          camera.position.set(Math.sin(ang) * dist, VP.lerp(2.4, .6, s), Math.cos(ang) * dist); camera.lookAt(0, 0, 0);
          knot.rotation.set(k * .21, k * .33, 0); knot.position.y = -.35; knot.scale.setScalar(VP.lerp(.55, 1, VP.sp0(k, 1.6, .8)));
          pts.rotation.y = k * .05;
          renderer.render(scene, camera);
        },
      };
    },
  };

  VP3.make = (kind, opt) => { if (!PRESETS[kind]) throw new Error('VP3: unknown scene ' + kind); return PRESETS[kind](opt); };
  VP3.presets = Object.keys(PRESETS);
  /* spring on a local beat clock (VP.sp is anchored to the global beat; scenes work in local beats) */
  VP.sp0 = (k, f = 2.2, z = .72) => VP.spring(k * VP.B, f, z);
  window.VP3 = VP3;
})();
