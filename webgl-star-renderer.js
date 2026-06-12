'use strict';

(() => {
  const VERTEX_SHADER = `
    attribute vec2 a_pos;
    attribute vec3 a_color;
    attribute float a_size;
    uniform vec2 u_resolution;
    uniform vec2 u_translate;
    uniform float u_scale;
    uniform float u_dpr;
    varying vec3 v_color;
    varying float v_alpha;
    void main() {
      vec2 screen = a_pos * u_scale + u_translate;
      vec2 zeroToOne = screen / u_resolution;
      vec2 clip = zeroToOne * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
      gl_PointSize = max(2.0, a_size * 2.25 * u_dpr);
      v_color = a_color;
      v_alpha = 1.0;
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec3 v_color;
    varying float v_alpha;
    uniform float u_alpha;
    void main() {
      vec2 uv = gl_PointCoord.xy * 2.0 - 1.0;
      float d = dot(uv, uv);
      if (d > 1.0) discard;
      float core = smoothstep(1.0, 0.10, d);
      float glow = smoothstep(1.0, 0.0, d) * 0.28;
      float a = clamp(core * 0.86 + glow, 0.0, 1.0) * u_alpha * v_alpha;
      gl_FragColor = vec4(v_color, a);
    }
  `;

  if (typeof canvas === 'undefined' || typeof viewport === 'undefined' || typeof state === 'undefined' || typeof chart === 'undefined') return;
  if (typeof tempX !== 'function' || typeof lumY !== 'function') return;

  const originalDraw = typeof draw === 'function' ? draw : null;
  const originalDrawStar = typeof drawStar === 'function' ? drawStar : null;
  const originalSampleStars = typeof sampleStars === 'function' ? sampleStars : null;

  const glCanvas = document.createElement('canvas');
  glCanvas.id = 'hrWebglCanvas';
  glCanvas.className = 'hr-webgl-canvas';
  glCanvas.setAttribute('aria-hidden', 'true');
  viewport.appendChild(glCanvas);

  const gl = glCanvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  }) || glCanvas.getContext('experimental-webgl');

  if (!gl || !originalDraw || !originalSampleStars) {
    glCanvas.remove();
    return;
  }

  let engine;
  try {
    engine = createEngine(gl, glCanvas);
  } catch (error) {
    console.warn('WebGL experimental desactivado:', error);
    glCanvas.remove();
    return;
  }

  document.body.classList.add('webgl-stars-active');
  window.__HR_WEBGL_RENDERER__ = engine;

  draw = function drawWithWebGLStars() {
    engine.clear();
    originalDraw();
  };

  sampleStars = function sampleStarsWebGL() {
    if (!state.layers.stars) {
      engine.clear();
      return;
    }

    if (!engine.render()) {
      originalSampleStars();
      return;
    }

    drawInteractiveStarOverlay();
  };

  window.addEventListener('resize', () => engine.resize(), { passive: true });
  window.addEventListener('load', () => {
    engine.resize();
    if (typeof draw === 'function') draw();
  });

  function drawInteractiveStarOverlay() {
    if (!originalDrawStar) return;
    const drawn = new Set();
    [state.selected, state.hovered].forEach(item => {
      if (!item || !Number.isFinite(item.teff) || !Number.isFinite(item.luminosity)) return;
      const key = item.id || item.name || `${item.teff}:${item.luminosity}`;
      if (drawn.has(key)) return;
      drawn.add(key);
      originalDrawStar(item);
    });
  }

  function createEngine(gl, canvasEl) {
    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(program);

    const locations = {
      aPos: gl.getAttribLocation(program, 'a_pos'),
      aColor: gl.getAttribLocation(program, 'a_color'),
      aSize: gl.getAttribLocation(program, 'a_size'),
      uResolution: gl.getUniformLocation(program, 'u_resolution'),
      uTranslate: gl.getUniformLocation(program, 'u_translate'),
      uScale: gl.getUniformLocation(program, 'u_scale'),
      uDpr: gl.getUniformLocation(program, 'u_dpr'),
      uAlpha: gl.getUniformLocation(program, 'u_alpha')
    };

    const buffer = gl.createBuffer();
    let cachedStars = null;
    let cachedLength = -1;
    let cachedSignature = '';
    let vertexCount = 0;
    let dpr = 1;

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
      const ratio = Math.min(devicePixelRatio || 1, 2.5);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * ratio));
      const h = Math.max(1, Math.round(rect.height * ratio));
      dpr = ratio;
      if (canvasEl.width !== w || canvasEl.height !== h) {
        canvasEl.width = w;
        canvasEl.height = h;
      }
      canvasEl.style.width = `${rect.width}px`;
      canvasEl.style.height = `${rect.height}px`;
      gl.viewport(0, 0, canvasEl.width, canvasEl.height);
    }

    function clear() {
      resize();
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function render() {
      if (!Array.isArray(state.stars) || !state.stars.length) {
        clear();
        return true;
      }

      resize();
      uploadIfNeeded();
      if (!vertexCount) {
        clear();
        return true;
      }

      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const left = Math.round(chart.axis.left * dpr);
      const bottom = Math.round(chart.axis.bottom * dpr);
      const width = Math.max(1, Math.round((chart.width - chart.axis.left - chart.axis.right) * dpr));
      const height = Math.max(1, Math.round((chart.height - chart.axis.top - chart.axis.bottom) * dpr));
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(left, bottom, width, height);

      gl.useProgram(program);
      gl.uniform2f(locations.uResolution, chart.width, chart.height);
      gl.uniform2f(locations.uTranslate, state.tx, state.ty);
      gl.uniform1f(locations.uScale, state.scale);
      gl.uniform1f(locations.uDpr, dpr);
      gl.uniform1f(locations.uAlpha, document.body.classList.contains('dark') ? 0.92 : 0.78);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const stride = 6 * 4;
      gl.enableVertexAttribArray(locations.aPos);
      gl.vertexAttribPointer(locations.aPos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(locations.aColor);
      gl.vertexAttribPointer(locations.aColor, 3, gl.FLOAT, false, stride, 2 * 4);
      gl.enableVertexAttribArray(locations.aSize);
      gl.vertexAttribPointer(locations.aSize, 1, gl.FLOAT, false, stride, 5 * 4);

      gl.drawArrays(gl.POINTS, 0, vertexCount);
      gl.disable(gl.SCISSOR_TEST);
      return true;
    }

    function uploadIfNeeded() {
      const stars = state.stars;
      const signature = `${stars.length}:${stars[0]?.name || ''}:${stars[stars.length - 1]?.name || ''}:${stars[0]?.teff || ''}:${stars[stars.length - 1]?.luminosity || ''}`;
      if (cachedStars === stars && cachedLength === stars.length && cachedSignature === signature) return;

      const data = new Float32Array(stars.length * 6);
      let offset = 0;
      let count = 0;

      for (const star of stars) {
        if (!star || !Number.isFinite(star.teff) || !Number.isFinite(star.luminosity) || star.luminosity <= 0) continue;
        const x = tempX(star.teff);
        const y = lumY(star.luminosity);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const [r, g, b] = parseColor(star.color || '#ffffff');
        const marker = Math.max(1.4, Math.min(7.5, Number(star.marker || 2.4)));
        data[offset++] = x;
        data[offset++] = y;
        data[offset++] = r;
        data[offset++] = g;
        data[offset++] = b;
        data[offset++] = marker;
        count++;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, count * 6), gl.STATIC_DRAW);
      vertexCount = count;
      cachedStars = stars;
      cachedLength = stars.length;
      cachedSignature = signature;
    }

    return { render, clear, resize, get count() { return vertexCount; } };
  }

  function parseColor(value) {
    const str = String(value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(str)) {
      return [parseInt(str.slice(1, 3), 16) / 255, parseInt(str.slice(3, 5), 16) / 255, parseInt(str.slice(5, 7), 16) / 255];
    }
    if (/^#[0-9a-f]{3}$/i.test(str)) {
      return [parseInt(str[1] + str[1], 16) / 255, parseInt(str[2] + str[2], 16) / 255, parseInt(str[3] + str[3], 16) / 255];
    }
    return [1, 1, 1];
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'No se pudo enlazar WebGL.');
    return program;
  }

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'No se pudo compilar WebGL.');
    return shader;
  }
})();
