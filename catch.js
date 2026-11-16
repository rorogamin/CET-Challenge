/* CET (Catch Em Turing) - secret easter egg at /catch.  Self-contained. */
(function () {
  'use strict';
  if (window.__CET_CATCH__) return;
  window.__CET_CATCH__ = true;

  var W = window, D = document, PI = Math.PI, TAU = PI * 2, rnd = Math.random;
  var baseDir = location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');

  D.documentElement.style.overflow = 'hidden';
  if (D.body) D.body.style.background = '#000';

  /* ------------------------------------------------------------------ */
  /* dom                                                                 */
  /* ------------------------------------------------------------------ */
  var style = D.createElement('style');
  style.textContent = [
    '#cetEgg{position:fixed;inset:0;z-index:2147483000;background:#01020a;overflow:hidden;',
    'font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#8defff;',
    '-webkit-user-select:none;user-select:none;cursor:crosshair}',
    '#eggGL{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;',
    'transition:opacity 1.1s ease;z-index:1}',
    '#eggGL.on{opacity:1}',
    '#eggChaos{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:3;',
    'transition:opacity .55s ease}',
    '#eggHud{position:absolute;left:22px;bottom:20px;z-index:4;opacity:0;',
    'transition:opacity .9s ease;text-shadow:0 0 14px rgba(60,200,255,.55)}',
    '#eggHud.on{opacity:1}',
    '#eggHud .k{color:#ffd36e}',
    '#eggHud .d{color:#4d7f95}',
    '#eggTop{position:absolute;left:22px;top:18px;z-index:4;opacity:0;',
    'transition:opacity .9s ease;letter-spacing:.3em;font-size:11px;color:#5aa9c4}',
    '#eggTop.on{opacity:1}',
    '#eggEnd{position:absolute;inset:0;z-index:5;display:flex;align-items:center;',
    'justify-content:center;flex-direction:column;gap:16px;opacity:0;',
    'pointer-events:none;transition:opacity .3s ease}',
    '#eggEnd.on{opacity:1}',
    '#eggEnd .big{font-size:clamp(22px,4.4vw,50px);letter-spacing:.4em;color:#fff;',
    'text-shadow:0 0 34px #6fe4ff,0 0 90px #2a8cff}',
    '#eggEnd .sub{font-size:11px;letter-spacing:.34em;color:#7fd9ff}',
    '#eggHint{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);z-index:6;',
    'font-size:11px;letter-spacing:.26em;color:#ffd36e;transition:opacity .6s ease;',
    'text-shadow:0 0 18px rgba(255,190,60,.6)}',
    '#eggHint.on{opacity:0}',
    '.eggShake{animation:eggShake .085s infinite}',
    '@keyframes eggShake{0%{transform:translate(0,0)}25%{transform:translate(-7px,3px)}',
    '50%{transform:translate(6px,-5px)}75%{transform:translate(-4px,-2px)}',
    '100%{transform:translate(5px,4px)}}'
  ].join('');
  D.head.appendChild(style);

  var egg = D.createElement('div');
  egg.id = 'cetEgg';
  egg.innerHTML =
    '<canvas id="eggGL"></canvas>' +
    '<canvas id="eggChaos"></canvas>' +
    '<div id="eggTop">CET &#9679; TAPE SECTOR 0 &#9679; NO DECIDER</div>' +
    '<div id="eggHud">' +
      '<div>READ <span class="k" id="eggRead">&mdash;</span> &nbsp; CELL <span class="k" id="eggCell">0</span>' +
      ' &nbsp; STATE <span class="k" id="eggState">A</span></div>' +
      '<div class="d" id="eggBot">OTHER MACHINE &mdash;</div>' +
      '<div class="d">[&#8592; &#8594;] move &nbsp; [SHIFT] sprint &nbsp; [SPACE] write &nbsp; [E] read &nbsp; [ESC] leave</div>' +
      '<div class="d">it stamps every cell to 1 \u00b7 collide with it to halt</div>' +
    '</div>' +
    '<div id="eggHint">CLICK OR PRESS A KEY FOR SOUND</div>' +
    '<div id="eggEnd"><div class="big" id="eggBig">HALTED</div>' +
    '<div class="sub" id="eggSub">REBOOTING TAPE #1</div></div>';
  D.body.appendChild(egg);
  egg.classList.add('eggShake');

  var glc = D.getElementById('eggGL');
  var chaos = D.getElementById('eggChaos');
  var hud = D.getElementById('eggHud');
  var topBar = D.getElementById('eggTop');
  var hint = D.getElementById('eggHint');
  var endBox = D.getElementById('eggEnd');
  var endBig = D.getElementById('eggBig');
  var endSub = D.getElementById('eggSub');
  var readEl = D.getElementById('eggRead');
  var cellEl = D.getElementById('eggCell');
  var stateEl = D.getElementById('eggState');
  var botEl = D.getElementById('eggBot');

  var gl = glc.getContext('webgl', { antialias: true, alpha: false, depth: true,
    powerPreference: 'high-performance' }) ||
    glc.getContext('experimental-webgl');
  if (!gl) {
    egg.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;' +
      'justify-content:center;flex-direction:column;gap:14px;color:#8defff;font:13px monospace">' +
      '<div>this machine has no graphics card to halt on</div>' +
      '<a href="' + baseDir + '" style="color:#ffd36e">back to the tape</a></div>';
    return;
  }

  /* ------------------------------------------------------------------ */
  /* small math                                                          */
  /* ------------------------------------------------------------------ */
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far), o = new Float32Array(16);
    o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf; o[11] = -1;
    o[14] = 2 * far * near * nf; o[15] = 0;
    return o;
  }
  function lookAt(eye, center, up) {
    var zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    var l = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1;
    zx /= l; zy /= l; zz /= l;
    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1;
    xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    var o = new Float32Array(16);
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
    o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
    o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
    o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    o[15] = 1;
    return o;
  }

  /* ------------------------------------------------------------------ */
  /* gl programs                                                         */
  /* ------------------------------------------------------------------ */
  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || 'shader');
    }
    return s;
  }
  function program(vsSrc, fsSrc) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || 'program');
    }
    return p;
  }
  function uniforms(p, names) {
    var o = {};
    for (var i = 0; i < names.length; i++) o[names[i]] = gl.getUniformLocation(p, names[i]);
    return o;
  }

  var SCENE_VS = [
    'attribute vec3 aPos;',
    'attribute vec3 aNrm;',
    'attribute vec2 aUV;',
    'uniform mat4 uVP;',
    'uniform vec3 uOffset;',
    'uniform vec3 uScale;',
    'varying vec2 vUV;',
    'varying vec3 vN;',
    'varying vec3 vW;',
    'void main(){',
    '  vec3 p = aPos * uScale + uOffset;',
    '  vW = p; vUV = aUV; vN = aNrm;',
    '  gl_Position = uVP * vec4(p, 1.0);',
    '}'
  ].join('\n');

  var SCENE_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'varying vec2 vUV;',
    'varying vec3 vN;',
    'varying vec3 vW;',
    'uniform vec3 uColor;',
    'uniform vec3 uCam;',
    'uniform float uMode;',
    'uniform float uFog;',
    'uniform float uTime;',
    'float band(float v, float c, float w){ return 1.0 - smoothstep(w, w * 1.9, abs(v - c)); }',
    'void main(){',
    '  vec3 col = uColor;',
    '  if (uMode > 3.5) {',
    '    vec2 g = vW.xz * 0.3 + vec2(uTime * 0.02, uTime * 0.01);',
    '    vec2 f = abs(fract(g) - 0.5);',
    '    float line = 1.0 - smoothstep(0.004, 0.02, min(f.x, f.y));',
    '    vec2 b = abs(fract(vW.xz * 0.045) - 0.5);',
    '    float big = 1.0 - smoothstep(0.003, 0.014, min(b.x, b.y));',
    '    col = uColor * (0.18 + line * 1.2 + big * 0.4);',
    '  } else if (uMode > 0.5) {',
    '    float e = min(min(vUV.x, 1.0 - vUV.x), min(vUV.y, 1.0 - vUV.y));',
    '    float frame = (1.0 - smoothstep(0.0, 0.1, e)) * 0.5;',
    '    float glyph = 0.0;',
    '    if (uMode > 2.5) {',
    '      float r = length((vUV - 0.5) * vec2(1.22, 1.0));',
    '      glyph = band(r, 0.24, 0.032);',
    '    } else if (uMode > 1.5) {',
    '      float bar = band(vUV.x, 0.5, 0.05) * step(0.24, vUV.y) * step(vUV.y, 0.76);',
    '      float foot = band(vUV.y, 0.25, 0.028) * step(0.34, vUV.x) * step(vUV.x, 0.66);',
    '      float head = band(vUV.y, 0.75, 0.028) * step(0.37, vUV.x) * step(vUV.x, 0.63);',
    '      glyph = max(max(bar, foot), head);',
    '    }',
    '    col = uColor * (frame + glyph * 1.5);',
    '  } else {',
    '    float e = min(min(vUV.x, 1.0 - vUV.x), min(vUV.y, 1.0 - vUV.y));',
    '    float rim = smoothstep(0.0, 0.085, e);',
    '    float shade = 0.28 + 0.52 * abs(dot(normalize(vN), normalize(uCam - vW)));',
    '    col = uColor * (shade * (0.5 + 0.5 * rim) + (1.0 - rim) * 1.15);',
    '  }',
    '  float d = length(vW - uCam);',
    '  col *= exp(-uFog * uFog * d * d);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var POINT_VS = [
    'attribute vec3 aPos;',
    'attribute vec3 aSeed;',
    'uniform mat4 uVP;',
    'uniform float uTime;',
    'uniform float uSize;',
    'uniform float uDrift;',
    'uniform float uScale;',
    'uniform float uBoom;',
    'uniform vec3 uOrigin;',
    'varying float vA;',
    'void main(){',
    '  vec3 p = aPos;',
    '  float a = 1.0;',
    '  if (uBoom > 0.001) {',
    '    vec3 dir = normalize(normalize(p - uOrigin) + aSeed * 0.6);',
    '    float sp = 2.6 + aSeed.x * 13.0;',
    '    p = uOrigin + dir * (sp * pow(uBoom, 0.62)) + vec3(0.0, -3.0 * uBoom * uBoom, 0.0);',
    '    a = 1.0 - smoothstep(0.7, 2.5, uBoom);',
    '  } else {',
    '    p += vec3(sin(uTime * 0.21 + aSeed.y * 6.28),',
    '              sin(uTime * 0.17 + aSeed.z * 6.28),',
    '              cos(uTime * 0.19 + aSeed.x * 6.28)) * uDrift;',
    '    a = 0.35 + 0.55 * (0.5 + 0.5 * sin(uTime * 0.9 + aSeed.y * 6.28));',
    '  }',
    '  vec4 cp = uVP * vec4(p, 1.0);',
    '  gl_Position = cp;',
    '  gl_PointSize = uSize * uScale * (0.5 + aSeed.z) / max(1.0, cp.w * 0.32);',
    '  vA = a;',
    '}'
  ].join('\n');

  var POINT_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'varying float vA;',
    'uniform vec3 uColorA;',
    'uniform vec3 uColorB;',
    'void main(){',
    '  float r = length(gl_PointCoord - 0.5);',
    '  if (r > 0.5) discard;',
    '  float a = (1.0 - smoothstep(0.0, 0.5, r)) * vA;',
    '  gl_FragColor = vec4(mix(uColorA, uColorB, a) * a, a);',
    '}'
  ].join('\n');

  var SHARD_VS = [
    'attribute vec2 aCorner;',
    'attribute vec2 aCenter;',
    'attribute vec3 aRand;',
    'attribute vec2 aUV;',
    'uniform vec2 uCell;',
    'uniform float uT;',
    'uniform float uAspect;',
    'varying vec2 vUV;',
    'varying vec2 vLocal;',
    'varying float vA;',
    'void main(){',
    '  vec2 pc = aCenter * vec2(uAspect, 1.0);',
    '  vec2 dir = normalize(pc + vec2(0.0001, 0.0001));',
    '  float speed = 0.8 + aRand.x * 1.7;',
    '  vec2 off = dir * speed * uT * 0.95 + aRand.yz * uT * 0.5;',
    '  float ang = aRand.z * 40.0 + uT * (1.4 + abs(aRand.x) * 6.0);',
    '  float s = sin(ang), c = cos(ang);',
    '  vec2 lc = mat2(c, -s, s, c) * (aCorner * uCell);',
    '  vec2 p = aCenter + off + lc + vec2(0.0, -0.5 * uT * uT);',
    '  gl_Position = vec4(p, 0.0, 1.0);',
    '  vUV = aUV;',
    '  vLocal = aCorner;',
    '  vA = 1.0 - smoothstep(1.4, 3.2, uT);',
    '}'
  ].join('\n');

  var SHARD_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'varying vec2 vUV;',
    'varying vec2 vLocal;',
    'varying float vA;',
    'uniform sampler2D uTex;',
    'uniform float uT;',
    'void main(){',
    '  vec3 c = texture2D(uTex, vUV).rgb;',
    '  float rim = smoothstep(0.40, 0.49, max(abs(vLocal.x), abs(vLocal.y)));',
    '  c = c * (1.0 + rim * 1.5) + vec3(0.12, 0.3, 0.45) * rim;',
    '  c = mix(vec3(1.0), c, clamp(uT * 3.5, 0.0, 1.0)) * 1.2;',
    '  gl_FragColor = vec4(c, vA);',
    '}'
  ].join('\n');

  var scene, sceneA, sceneU, points, pointA, pointU, shardP, shardA, shardU;
  try {
    scene = program(SCENE_VS, SCENE_FS);
    points = program(POINT_VS, POINT_FS);
    shardP = program(SHARD_VS, SHARD_FS);
    sceneA = {
      pos: gl.getAttribLocation(scene, 'aPos'),
      nrm: gl.getAttribLocation(scene, 'aNrm'),
      uv: gl.getAttribLocation(scene, 'aUV')
    };
    sceneU = uniforms(scene, ['uVP', 'uOffset', 'uScale', 'uColor', 'uCam', 'uMode', 'uFog', 'uTime']);
    pointA = {
      pos: gl.getAttribLocation(points, 'aPos'),
      seed: gl.getAttribLocation(points, 'aSeed')
    };
    pointU = uniforms(points, ['uVP', 'uTime', 'uSize', 'uDrift', 'uScale', 'uBoom', 'uOrigin',
      'uColorA', 'uColorB']);
    shardA = {
      corner: gl.getAttribLocation(shardP, 'aCorner'),
      center: gl.getAttribLocation(shardP, 'aCenter'),
      rand: gl.getAttribLocation(shardP, 'aRand'),
      uv: gl.getAttribLocation(shardP, 'aUV')
    };
    shardU = uniforms(shardP, ['uCell', 'uT', 'uAspect', 'uTex']);
  } catch (err) {
    W.__catchErr = String((err && err.message) || err);
    egg.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;' +
      'justify-content:center;flex-direction:column;gap:14px;color:#8defff;font:13px monospace">' +
      '<div>the tape refuses to compile on this machine</div>' +
      '<a href="' + baseDir + '" style="color:#ffd36e">back to the tape</a></div>';
    return;
  }

  /* ------------------------------------------------------------------ */
  /* geometry                                                            */
  /* ------------------------------------------------------------------ */
  function buf(data) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return b;
  }
  function makeMesh(pos, nrm, uv) {
    return { n: pos.length / 3, pos: buf(pos), nrm: buf(nrm), uv: buf(uv) };
  }
  function drawMesh(m) {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.pos);
    gl.enableVertexAttribArray(sceneA.pos);
    gl.vertexAttribPointer(sceneA.pos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.nrm);
    gl.enableVertexAttribArray(sceneA.nrm);
    gl.vertexAttribPointer(sceneA.nrm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.uv);
    gl.enableVertexAttribArray(sceneA.uv);
    gl.vertexAttribPointer(sceneA.uv, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, m.n);
  }

  var quad = makeMesh(
    [-0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5],
    [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]
  );

  (function () {
    var pos = [], nrm = [], uv = [];
    var faces = [
      [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
      [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
      [[0, -1, 0], [1, 0, 0], [0, 0, -1]],
      [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
      [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]
    ];
    var corners = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    var uvs = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
    for (var f = 0; f < 6; f++) {
      var n = faces[f][0], u = faces[f][1], v = faces[f][2];
      for (var i = 0; i < 6; i++) {
        var c = corners[i];
        pos.push(
          n[0] * 0.5 + u[0] * c[0] * 0.5 + v[0] * c[1] * 0.5,
          n[1] * 0.5 + u[1] * c[0] * 0.5 + v[1] * c[1] * 0.5,
          n[2] * 0.5 + u[2] * c[0] * 0.5 + v[2] * c[1] * 0.5
        );
        nrm.push(n[0], n[1], n[2]);
        uv.push(uvs[i][0], uvs[i][1]);
      }
    }
    window.__cube = makeMesh(pos, nrm, uv);
  })();
  var cube = window.__cube;
  delete window.__cube;

  function cloud(n, spread, flatten) {
    var pos = new Float32Array(n * 3), seed = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var u = rnd() * 2 - 1, th = rnd() * TAU, r = Math.pow(rnd(), 0.42) * spread;
      var s = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(th) * s * r;
      pos[i * 3 + 1] = Math.sin(th) * s * r * flatten + 1.4;
      pos[i * 3 + 2] = u * r * 0.8;
      seed[i * 3] = rnd() * 2 - 1;
      seed[i * 3 + 1] = rnd();
      seed[i * 3 + 2] = rnd();
    }
    return { n: n, pos: buf(pos), seed: buf(seed) };
  }
  var dust = cloud(900, 34, 0.55);
  var sparks = cloud(180000, 1.6, 1);

  function drawPoints(pc, size, drift, boom, origin, colA, colB, vp) {
    gl.useProgram(points);
    gl.uniformMatrix4fv(pointU.uVP, false, vp);
    gl.uniform1f(pointU.uTime, tAll);
    gl.uniform1f(pointU.uSize, size);
    gl.uniform1f(pointU.uScale, Math.min(2, W.devicePixelRatio || 1));
    gl.uniform1f(pointU.uDrift, drift);
    gl.uniform1f(pointU.uBoom, boom);
    gl.uniform3f(pointU.uOrigin, origin[0], origin[1], origin[2]);
    gl.uniform3f(pointU.uColorA, colA[0], colA[1], colA[2]);
    gl.uniform3f(pointU.uColorB, colB[0], colB[1], colB[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, pc.pos);
    gl.enableVertexAttribArray(pointA.pos);
    gl.vertexAttribPointer(pointA.pos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, pc.seed);
    gl.enableVertexAttribArray(pointA.seed);
    gl.vertexAttribPointer(pointA.seed, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, pc.n);
  }

  /* ------------------------------------------------------------------ */
  /* world                                                               */
  /* ------------------------------------------------------------------ */
  var N = 37, CELL = 2.9;
  var X0 = -(N - 1) / 2 * CELL;
  var symbols = [], i;
  for (i = 0; i < N; i++) symbols[i] = rnd() < 0.38 ? '1' : '';

  function cellX(k) { return X0 + k * CELL; }
  function cellOf(x) { return Math.max(0, Math.min(N - 1, Math.round((x - X0) / CELL))); }

  var P = { x: cellX(12), y: 1.15 };
  /* The other machine is a one-symbol transition table: everything it reads is
     a 1. It stamps a 1 into the cell under the head and steps on; A sweeps
     right, B sweeps left, and the ends of the tape turn it around. */
  var TM = { A: ['1', 1, 'A'], B: ['1', -1, 'B'] };
  var BOT_STEP = 0.24;
  var B = { x: cellX(N - 9), y: 1.15, cell: N - 9, from: N - 9, to: N - 9,
    timer: 0, state: 'A', writes: 0 };
  var camShake = 0, shakeDecay = 0, botFlash = 0;
  var flashCell = -1, flashT = 0;
  var tAll = 0, phase = 'chaos', tChaos = 0, haltT = 0, boomT = 0;
  var halted = [0, 0, 0], lastVP = null, GW = 2, GH = 2;
  var keys = { left: false, right: false, shift: false };

  function resize() {
    var dpr = Math.min(2, W.devicePixelRatio || 1);
    GW = Math.max(320, Math.round(W.innerWidth * dpr));
    GH = Math.max(200, Math.round(W.innerHeight * dpr));
    glc.width = GW;
    glc.height = GH;
    chaos.width = Math.max(320, W.innerWidth);
    chaos.height = Math.max(200, W.innerHeight);
  }
  resize();
  W.addEventListener('resize', resize);

  /* ------------------------------------------------------------------ */
  /* audio                                                               */
  /* ------------------------------------------------------------------ */
  var A = null, moveTick = 0, unlocked = false;

  function noiseBuffer(ctx, sec) {
    var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
    return b;
  }
  function impulseBuffer(ctx, sec, decay) {
    var len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  function audioInit() {
    if (A) return A;
    var Ctx = W.AudioContext || W.webkitAudioContext;
    if (!Ctx) return null;
    var ctx = new Ctx();
    var master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 24; comp.ratio.value = 4;
    comp.attack.value = 0.004; comp.release.value = 0.28;
    comp.connect(master);
    var conv = ctx.createConvolver();
    conv.buffer = impulseBuffer(ctx, 2.6, 2.4);
    var wet = ctx.createGain(); wet.gain.value = 0.55;
    conv.connect(wet); wet.connect(comp);
    var send = ctx.createGain(); send.gain.value = 1; send.connect(conv);
    var bus = ctx.createGain(); bus.gain.value = 1; bus.connect(comp);

    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth';
    o1.frequency.value = 55; o2.frequency.value = 55.6;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 170; lp.Q.value = 7;
    var dg = ctx.createGain(); dg.gain.value = 0.085;
    o1.connect(lp); o2.connect(lp); lp.connect(dg);
    dg.connect(bus); dg.connect(send);
    o1.start(); o2.start();
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    var lfoG = ctx.createGain(); lfoG.gain.value = 75;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();

    var windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuffer(ctx, 3.2);
    windSrc.loop = true;
    var windBP = ctx.createBiquadFilter();
    windBP.type = 'bandpass'; windBP.frequency.value = 460; windBP.Q.value = 0.65;
    var windG = ctx.createGain(); windG.gain.value = 0.045;
    windSrc.connect(windBP); windBP.connect(windG); windG.connect(bus); windSrc.start();

    var botOsc = ctx.createOscillator();
    botOsc.type = 'sawtooth'; botOsc.frequency.value = 92;
    var botF = ctx.createBiquadFilter();
    botF.type = 'lowpass'; botF.frequency.value = 540; botF.Q.value = 3;
    var botGain = ctx.createGain(); botGain.gain.value = 0;
    var panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    botOsc.connect(botF); botF.connect(botGain);
    if (panner) { botGain.connect(panner); panner.connect(bus); panner.connect(send); }
    else { botGain.connect(bus); botGain.connect(send); }
    botOsc.start();

    A = { ctx: ctx, bus: bus, send: send, master: master, botOsc: botOsc,
      botGain: botGain, panner: panner };
    master.gain.setTargetAtTime(0.85, ctx.currentTime + 0.05, 0.6);
    return A;
  }

  function ping(freq, dur, type, gain, pan) {
    if (!A) return;
    var ctx = A.ctx, t = ctx.currentTime;
    var o = ctx.createOscillator();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    if (A.panner && pan !== undefined) {
      var p = ctx.createStereoPanner();
      p.pan.setValueAtTime(pan, t);
      g.connect(p); p.connect(A.bus); p.connect(A.send);
    } else { g.connect(A.bus); g.connect(A.send); }
    o.start(t); o.stop(t + dur + 0.05);
  }

  function burst(dur, freq, q, gain, type) {
    if (!A) return;
    var ctx = A.ctx, t = ctx.currentTime;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, Math.max(0.08, dur));
    var f = ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq; f.Q.value = q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(A.bus); g.connect(A.send);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function riserSound() {
    if (!A) return;
    var ctx = A.ctx, t = ctx.currentTime;
    var o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(55, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + 1.9);
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(280, t);
    f.frequency.exponentialRampToValueAtTime(7000, t + 1.9);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.05);
    o.connect(f); f.connect(g); g.connect(A.bus); g.connect(A.send);
    o.start(t); o.stop(t + 2.1);
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 2);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(5600, t + 1.9);
    bp.Q.value = 0.9;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.12, t + 1.7);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 2.05);
    src.connect(bp); bp.connect(ng); ng.connect(A.bus); ng.connect(A.send);
    src.start(t); src.stop(t + 2.1);
  }

  function boomSound() {
    if (!A) return;
    var ctx = A.ctx, t = ctx.currentTime;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(76, t);
    o.frequency.exponentialRampToValueAtTime(24, t + 1.7);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 2.7);
    o.connect(g); g.connect(A.bus); g.connect(A.send);
    o.start(t); o.stop(t + 2.9);
    burst(1.3, 150, 0.7, 0.75);
    burst(2.6, 1400, 0.4, 0.22, 'highpass');
  }

  function unlockAudio() {
    if (unlocked) return;
    var a = audioInit();
    if (!a) return;
    unlocked = true;
    hint.classList.add('on');
    if (a.ctx.state === 'suspended') a.ctx.resume();
    if (phase === 'chaos') riserSound();
    else if (phase === 'play') ping(220, 1.4, 'sine', 0.12);
  }
  D.addEventListener('pointerdown', unlockAudio);
  D.addEventListener('keydown', unlockAudio);

  function sfx(kind, opt) {
    if (!A) return;
    opt = opt || {};
    if (kind === 'read') {
      var s = opt.sym;
      ping(s === '1' ? 660 : s === '0' ? 440 : 262, 0.32, 'triangle', 0.16);
      ping(s === '1' ? 1320 : s === '0' ? 880 : 524, 0.18, 'sine', 0.05);
    } else if (kind === 'write') {
      burst(0.07, 2600, 1.1, 0.14);
      ping(opt.sym === '1' ? 300 : opt.sym === '0' ? 200 : 150, 0.16, 'square', 0.05);
    } else if (kind === 'flip') {
      ping(560, 0.1, 'square', 0.06);
    } else if (kind === 'step') {
      burst(0.05, 2100, 1.6, 0.035);
    } else if (kind === 'jump') {
      ping(880, 0.28, 'sine', 0.09);
      burst(0.3, 3200, 0.7, 0.08);
    } else if (kind === 'wall') {
      ping(96, 0.22, 'square', 0.1);
      burst(0.12, 700, 0.8, 0.2);
    }
  }

  function botAudio() {
    if (!A) return;
    var t = A.ctx.currentTime, dx = B.x - P.x, d = Math.abs(dx);
    A.botGain.gain.setTargetAtTime(Math.max(0, 1 - d / 30) * 0.2, t, 0.09);
    A.botOsc.frequency.setTargetAtTime(80 + Math.min(70, d * 2.0), t, 0.12);
    if (A.panner) A.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, dx / 12)), t, 0.1);
  }

  /* ------------------------------------------------------------------ */
  /* hud                                                                 */
  /* ------------------------------------------------------------------ */
  var hudState = '';
  function updateHud() {
    var k = cellOf(P.x), s = symbols[k];
    readEl.textContent = s === '1' ? '1' : s === '0' ? '0' : 'BLANK';
    cellEl.textContent = String(k + 1) + ' / ' + N;
    stateEl.textContent = B.state + (B.state === 'A' ? ' \u25b6' : ' \u25c0');
    var dx = B.x - P.x, d = Math.abs(dx);
    botEl.textContent = 'OTHER MACHINE ' + (B.state === 'A' ? '\u25b6' : '\u25c0') + ' ' +
      d.toFixed(1) + ' units \u00b7 ' + B.writes + ' writes';
  }

  /* ------------------------------------------------------------------ */
  /* chaos                                                               */
  /* ------------------------------------------------------------------ */
  var chaosCtx = chaos.getContext('2d');
  var glitchWords = ['TRACE', 'DECIDER', 'COLLISION', 'HALT?', 'NO', 'TAPE', 'CATCH',
    'OK', 'FAIL', 'INF', '0x3F', 'LOST', 'STATE', 'C', 'B', 'A', '42', 'NOPE'];
  function chaosFrame(dt) {
    tChaos += dt;
    var w = chaos.width, h = chaos.height, c = chaosCtx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = rnd() < 0.08 ? '#ffffff' : (rnd() < 0.25 ? '#12001c' : '#02030a');
    c.fillRect(0, 0, w, h);
    var i, n;
    for (i = 0, n = 26; i < n; i++) {
      c.fillStyle = 'rgba(' + (rnd() * 255 | 0) + ',' + (rnd() * 255 | 0) + ',' +
        (rnd() * 255 | 0) + ',' + (0.1 + rnd() * 0.5).toFixed(2) + ')';
      c.fillRect(rnd() * w * 0.3, rnd() * h, w * (0.4 + rnd() * 0.6), 1 + rnd() * 34);
    }
    c.font = Math.max(9, Math.floor(h * 0.032)) + 'px ui-monospace, monospace';
    c.fillStyle = 'rgba(150,255,255,0.72)';
    for (i = 0, n = 26; i < n; i++) {
      c.fillText(glitchWords[rnd() * glitchWords.length | 0] + ' ' +
        (rnd() * 1e6 | 0).toString(16), rnd() * w * 0.75, rnd() * h);
    }
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate((rnd() - 0.5) * 0.25);
    c.font = '700 ' + Math.floor(h * (0.09 + rnd() * 0.05)) + 'px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillStyle = rnd() < 0.5 ? 'rgba(255,64,96,0.85)' : 'rgba(90,240,255,0.85)';
    c.fillText(glitchWords[rnd() * glitchWords.length | 0], 0, 0);
    c.restore();
    c.fillStyle = 'rgba(0,0,0,0.22)';
    for (i = 0; i < h; i += 3) c.fillRect(0, i, w, 1);
    if (tChaos > 2.0) enterPlay();
  }

  function enterPlay() {
    phase = 'play';
    egg.classList.remove('eggShake');
    chaos.style.opacity = '0';
    glc.classList.add('on');
    hud.classList.add('on');
    topBar.classList.add('on');
    W.setTimeout(function () { chaos.style.display = 'none'; }, 640);
    if (A) { ping(150, 0.9, 'sine', 0.16); riserSound(); }
    renderScene(0.016);
  }

  /* ------------------------------------------------------------------ */
  /* scene render                                                        */
  /* ------------------------------------------------------------------ */
  var camEye = [0, 7, 10.4], camLook = [0, 0.8, -6];
  function cameraVP(zoom) {
    var shake = camShake;
    var tx = P.x * 0.9, ty = 7.2, tz = 11.8;
    if (zoom) { tx = halted[0]; ty = 3.7; tz = 5.4; }
    var ex = tx + (rnd() - 0.5) * shake;
    var ey = ty + Math.sin(tAll * 0.7) * 0.22 + (rnd() - 0.5) * shake;
    var ez = tz + (rnd() - 0.5) * shake;
    var lx = zoom ? halted[0] : P.x * 0.99;
    var ly = zoom ? halted[1] : 0.72;
    var lz = zoom ? halted[2] : -6.6;
    camEye = [ex, ey, ez];
    camLook = [lx, ly, lz];
    var view = lookAt(camEye, camLook, [0, 1, 0]);
    return mul(perspective(PI / 3, GW / GH, 0.08, 300), view);
  }

  function setMesh(mode, off, scale, col) {
    gl.uniform1f(sceneU.uMode, mode);
    gl.uniform3f(sceneU.uOffset, off[0], off[1], off[2]);
    gl.uniform3f(sceneU.uScale, scale[0], scale[1], scale[2]);
    gl.uniform3f(sceneU.uColor, col[0], col[1], col[2]);
  }

  var COL_BLANK = [0.13, 0.3, 0.46], COL_ONE = [1.0, 0.76, 0.3], COL_ZERO = [0.36, 0.9, 1.0];

  function renderScene(dt) {
    var zoom = phase === 'halt';
    var vp = cameraVP(zoom);
    lastVP = vp;
    gl.viewport(0, 0, GW, GH);
    gl.clearColor(0.004, 0.007, 0.018, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.BLEND);

    gl.useProgram(scene);
    gl.uniformMatrix4fv(sceneU.uVP, false, vp);
    gl.uniform3f(sceneU.uCam, camEye[0], camEye[1], camEye[2]);
    gl.uniform1f(sceneU.uFog, 0.043);
    gl.uniform1f(sceneU.uTime, tAll);

    setMesh(4, [0, -0.08, 0], [520, 1, 520], [0.07, 0.2, 0.34]);
    drawMesh(quad);

    setMesh(0, [0, 0, -8], [1.1, 19, 1.1], [0.03, 0.08, 0.15]);
    for (var x = -56; x <= 56; x += 18.67) {
      gl.uniform3f(sceneU.uOffset, x, 9, -9);
      drawMesh(cube);
    }

    for (var k = 0; k < N; k++) {
      var s = symbols[k];
      var col = s === '1' ? COL_ONE : s === '0' ? COL_ZERO : COL_BLANK;
      if (flashCell === k && flashT > 0) {
        var b = 1 + flashT * 1.6;
        col = [col[0] * b, col[1] * b, col[2] * b];
      }
      setMesh(s === '1' ? 2 : s === '0' ? 3 : 1, [cellX(k), 0.02, 0], [CELL * 0.92, 1, 7.2], col);
      drawMesh(quad);
    }

    var bob = Math.sin(tAll * 2.4) * 0.09;
    setMesh(0, [P.x, P.y + bob, 0], [1.9, 1.9, 1.9], [0.35, 0.95, 1.0]);
    drawMesh(cube);
    gl.uniform3f(sceneU.uOffset, P.x, P.y + bob, 0);
    gl.uniform3f(sceneU.uScale, 2.6, 2.6, 2.6);
    gl.uniform3f(sceneU.uColor, 0.06, 0.3, 0.42);
    drawMesh(cube);

    var bbob = Math.sin(tAll * 1.7 + 1.3) * 0.1;
    var bf = Math.min(1, botFlash) * 0.85;
    setMesh(0, [B.x, B.y + bbob, 0], [1.9, 1.9, 1.9],
      [1.0, 0.26 + 0.7 * bf, 0.34 + 0.5 * bf]);
    drawMesh(cube);
    gl.uniform3f(sceneU.uOffset, B.x, B.y + bbob, 0);
    gl.uniform3f(sceneU.uScale, 2.6, 2.6, 2.6);
    gl.uniform3f(sceneU.uColor, 0.4 + 0.5 * bf, 0.05 + 0.6 * bf, 0.09 + 0.6 * bf);
    drawMesh(cube);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.depthMask(false);
    drawPoints(dust, 1.5, 0.5, 0, [0, 0, 0], [0.35, 0.7, 1.0], [0.9, 1.0, 1.0], vp);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  /* ------------------------------------------------------------------ */
  /* play update                                                         */
  /* ------------------------------------------------------------------ */
  function playerCell() { return cellOf(P.x); }

  function writeCell() {
    var k = playerCell(), s = symbols[k];
    symbols[k] = s === '' ? '1' : s === '1' ? '0' : '';
    flashCell = k; flashT = 1;
    sfx('write', { sym: symbols[k] });
    updateHud();
  }
  function readCell() {
    var k = playerCell();
    flashCell = k; flashT = 1;
    sfx('read', { sym: symbols[k] });
    updateHud();
  }

  // one transition: whatever is under the head becomes 1, then step.
  function botStep() {
    var row = TM[B.state];
    var w = row[0], d = row[1], ns = row[2];
    if (symbols[B.cell] !== w) {
      symbols[B.cell] = w;
      B.writes++;
      flashCell = B.cell;
      flashT = Math.max(flashT, 0.5);
      sfx('write', { sym: w });
    }
    var next = B.cell + d;
    if (next < 0 || next >= N) {
      // the tape ends behave like a mirror cell
      next = B.cell - d;
      ns = d > 0 ? 'B' : 'A';
      sfx('wall');
    }
    B.from = B.cell;
    B.to = next;
    B.timer = 0;
    if (ns !== B.state) {
      botFlash = Math.max(botFlash, 0.7);
      sfx('flip');
    }
    B.state = ns;
    updateHud();
  }

  function halt() {
    if (phase !== 'play') return;
    phase = 'halt';
    haltT = 0;
    camShake = 1.1;
    halted = [(P.x + B.x) / 2, 1.1, 0];
    endBig.textContent = 'HALTED';
    endSub.textContent = 'CET(3) COLLISION';
    endBox.classList.add('on');
    hud.classList.remove('on');
    topBar.classList.remove('on');
    sfx('wall');
    boomSound();
  }

  function updatePlay(dt) {
    var speed = keys.shift ? 17.0 : 11.0;
    if (keys.left) P.x -= speed * dt;
    if (keys.right) P.x += speed * dt;
    P.x = Math.max(cellX(0) - 0.9, Math.min(cellX(N - 1) + 0.9, P.x));
    P.y = 1.15;

    moveTick -= dt;
    if ((keys.left || keys.right) && moveTick <= 0) {
      moveTick = keys.shift ? 0.16 : 0.26;
      sfx('step');
    }

    camShake = Math.max(0, camShake - dt * 1.6);
    flashT = Math.max(0, flashT - dt * 2.2);

    B.timer += dt;
    if (B.timer >= BOT_STEP) {
      // the slide has landed: only now is the head standing on the next cell
      B.cell = B.to;
      botStep();
    }
    var bk = Math.min(1, B.timer / BOT_STEP);
    B.x = cellX(B.from) + (cellX(B.to) - cellX(B.from)) * bk;

    botFlash = Math.max(0, botFlash - dt * 1.2);

    B.y = 1.15;
    botAudio();
    updateHud();

    // the halting transition: the head reaches the cell you are standing on
    if (Math.abs(B.x - P.x) < 1.1) halt();
  }

  /* ------------------------------------------------------------------ */
  /* explosion                                                           */
  /* ------------------------------------------------------------------ */
  var SH_COLS = 132, SH_ROWS = 78, shardBuf = null;
  var shotTex = gl.createTexture();

  /* The canvas is multisampled, so copyTexImage2D is illegal there: redraw the
     last frame into an offscreen target and use that as the shard texture. */
  function snapshot() {
    gl.bindTexture(gl.TEXTURE_2D, shotTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var fb = gl.createFramebuffer();
    var rb = gl.createRenderbuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shotTex, 0);
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, GW, GH);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) renderScene(0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.deleteRenderbuffer(rb);
    gl.viewport(0, 0, GW, GH);
  }

  function buildShards() {
    var n = SH_COLS * SH_ROWS, data = new Float32Array(n * 6 * 9), o = 0;
    var corners = [[-0.5, -0.5, 0, 0], [0.5, -0.5, 1, 0], [0.5, 0.5, 1, 1],
      [-0.5, -0.5, 0, 0], [0.5, 0.5, 1, 1], [-0.5, 0.5, 0, 1]];
    var du = 1 / SH_COLS, dv = 1 / SH_ROWS;
    for (var y = 0; y < SH_ROWS; y++) {
      for (var x = 0; x < SH_COLS; x++) {
        var cx = (x + 0.5) * du * 2 - 1;
        var cy = (y + 0.5) * dv * 2 - 1;
        var u0 = x * du, v0 = y * dv;
        var rx = rnd() * 2 - 1, ry = rnd() * 2 - 1, rz = rnd();
        for (var k = 0; k < 6; k++) {
          var c = corners[k];
          data[o++] = c[0]; data[o++] = c[1];
          data[o++] = cx; data[o++] = cy;
          data[o++] = rx; data[o++] = ry; data[o++] = rz;
          data[o++] = u0 + c[2] * du; data[o++] = v0 + c[3] * dv;
        }
      }
    }
    if (!shardBuf) shardBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shardBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  function startBoom() {
    phase = 'boom';
    boomT = 0;
    snapshot();
    buildShards();
    endBig.textContent = 'HALTED';
    endSub.textContent = 'A BILLION PIECES \u00b7 REBOOTING TAPE #1';
    glc.style.transition = 'none';
  }

  function renderBoom(dt) {
    boomT += dt;
    gl.viewport(0, 0, GW, GH);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(shardP);
    gl.uniform1f(shardU.uT, boomT);
    gl.uniform2f(shardU.uCell, 1 / SH_COLS, 1 / SH_ROWS);
    gl.uniform1f(shardU.uAspect, GW / GH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shotTex);
    gl.uniform1i(shardU.uTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, shardBuf);
    gl.enableVertexAttribArray(shardA.corner);
    gl.vertexAttribPointer(shardA.corner, 2, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(shardA.center);
    gl.vertexAttribPointer(shardA.center, 2, gl.FLOAT, false, 36, 8);
    gl.enableVertexAttribArray(shardA.rand);
    gl.vertexAttribPointer(shardA.rand, 3, gl.FLOAT, false, 36, 16);
    gl.enableVertexAttribArray(shardA.uv);
    gl.vertexAttribPointer(shardA.uv, 2, gl.FLOAT, false, 36, 28);
    gl.drawArrays(gl.TRIANGLES, 0, 6 * SH_COLS * SH_ROWS);

    gl.blendFunc(gl.ONE, gl.ONE);
    drawPoints(sparks, 3.4, 0, boomT, halted, [1.0, 0.93, 0.75], [0.4, 0.78, 1.0], lastVP);

    endBox.classList.add('on');
    if (boomT > 2.9) {
      D.body.style.transition = 'opacity .2s';
      location.replace(baseDir + '#1');
    }
  }

  /* ------------------------------------------------------------------ */
  /* loop + input                                                        */
  /* ------------------------------------------------------------------ */
  var last = 0;
  function frame(now) {
    W.requestAnimationFrame(frame);
    if (!last) last = now;
    var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    tAll += dt;

    if (phase === 'chaos') {
      chaosFrame(dt);
    } else if (phase === 'play') {
      updatePlay(dt);
      renderScene(dt);
    } else if (phase === 'halt') {
      haltT += dt;
      camShake = Math.max(0.2, camShake - dt * 1.4);
      renderScene(dt);
      if (haltT > 0.5) startBoom();
    } else if (phase === 'boom') {
      renderBoom(dt);
    }
  }

  function onKey(e, down) {
    var k = (e.key || '').toLowerCase();
    if (down) unlockAudio();
    if (phase === 'play') {
      if (k === 'arrowleft' || k === 'a') { keys.left = down; e.preventDefault(); }
      if (k === 'arrowright' || k === 'd') { keys.right = down; e.preventDefault(); }
      if (k === 'shift') keys.shift = down;
      if (down && k === ' ' && !e.repeat) { writeCell(); e.preventDefault(); }
      if (down && (k === 'e') && !e.repeat) { readCell(); e.preventDefault(); }
    }
    if (down && k === 'escape') {
      location.href = baseDir;
    }
  }
  D.addEventListener('keydown', function (e) { onKey(e, true); });
  D.addEventListener('keyup', function (e) {
    var k = (e.key || '').toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
    if (k === 'shift') keys.shift = false;
  });

  W.__catch = {
    state: function () {
      return { phase: phase, px: P.x, bx: B.x, cell: scell(P.x), state: B.state,
        writes: B.writes, botCell: B.cell,
        tape: symbols.map(function (s) { return s || '.'; }).join(''),
        botFlash: botFlash, audio: A ? A.ctx.state : 'none',
        halted: phase === 'halt' || phase === 'boom' };
    },
    win: function () { if (phase === 'play') B.x = P.x; },
    skipChaos: function () { if (phase === 'chaos') enterPlay(); },
    tick: function (dt) {
      dt = dt || 0.016;
      tAll += dt;
      if (phase === 'chaos') chaosFrame(dt);
      else if (phase === 'play') { updatePlay(dt); renderScene(dt); }
      else if (phase === 'halt') {
        haltT += dt;
        camShake = Math.max(0.2, camShake - dt * 1.4);
        renderScene(dt);
        if (haltT > 0.5) startBoom();
      } else if (phase === 'boom') renderBoom(dt);
    },
    write: writeCell,
    read: readCell,
    audio: function () { return !!audioInit(); }
  };
  function scell(x) { return cellOf(x); }

  W.requestAnimationFrame(frame);
})();
