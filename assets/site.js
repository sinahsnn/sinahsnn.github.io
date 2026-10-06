// Header animation: a synthetic multimodal recording.
// Seven signals share one clock. A stimulus (a word) arrives every few
// seconds, and the pupil and skin conductance respond a moment later.
(function () {
  var panel = document.getElementById("recording");
  var canvas = document.getElementById("signals");
  if (!panel || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var lanes = Array.prototype.slice.call(panel.querySelectorAll(".lane"));
  if (!lanes.length) return;

  var TAU = Math.PI * 2;
  var PERIOD = 6;      // seconds between stimuli
  var ONSET = 2;       // stimulus time within each period
  var RESP_HZ = 0.25;  // 15 breaths a minute
  var BEAT = 0.86;     // about 70 beats a minute

  function frac(x) { return x - Math.floor(x); }
  function gauss(x, c, w) { var d = (x - c) / w; return Math.exp(-0.5 * d * d); }

  function resp(t) {
    var x = TAU * RESP_HZ * t;
    return Math.sin(x) + 0.22 * Math.sin(2 * x + 0.6);
  }

  // Beat phase, sped up and slowed down by breathing (respiratory sinus arrhythmia).
  function beatPhase(t) { return t / BEAT + 0.04 * Math.sin(TAU * RESP_HZ * t); }

  function ecg(t) {
    var x = frac(beatPhase(t));
    return 0.14 * gauss(x, 0.18, 0.03) - 0.12 * gauss(x, 0.285, 0.012) + 1.2 * gauss(x, 0.3, 0.013)
      - 0.28 * gauss(x, 0.318, 0.013) + 0.32 * gauss(x, 0.52, 0.055);
  }

  function pulseShape(y) { return gauss(y, 0.16, 0.06) + 0.42 * gauss(y, 0.46, 0.1); }

  // The pulse reaches the finger a little after each heartbeat.
  function ppg(t) {
    var y = frac(beatPhase(t) - 0.42);
    return (pulseShape(y) + pulseShape(y + 1) + pulseShape(y - 1)) * (1 + 0.12 * resp(t));
  }

  function alpha(t) {
    var e = 0.5 + 0.5 * Math.sin(TAU * 0.13 * t + 2 * Math.sin(TAU * 0.07 * t));
    return 0.3 + 0.7 * e * e;
  }

  function eeg(t) {
    return 0.75 * alpha(t) * Math.sin(TAU * 9.5 * t + 1.3 * Math.sin(TAU * 0.31 * t))
      + 0.34 * Math.sin(TAU * 4.3 * t + 1) + 0.22 * Math.sin(TAU * 17 * t + 2.1)
      + 0.14 * Math.sin(TAU * 2.1 * t + 0.4);
  }

  // Sum a response function over the last few stimuli.
  function evoked(t, delay, fn) {
    var k = Math.floor((t - ONSET) / PERIOD), v = 0;
    for (var j = 0; j < 4; j++) {
      var x = t - ((k - j) * PERIOD + ONSET) - delay;
      if (x > 0) v += fn(x);
    }
    return v;
  }

  function eda(t) {
    return 0.22 * Math.sin(TAU * 0.021 * t)
      + evoked(t, 1.2, function (x) { return 1.9 * (Math.exp(-x / 3.2) - Math.exp(-x / 0.75)); });
  }

  function pupil(t) {
    return 0.1 * Math.sin(TAU * 0.4 * t) + 0.07 * Math.sin(TAU * 0.17 * t + 1)
      + evoked(t, 0.35, function (x) { return 2.2 * (Math.exp(-x / 1.5) - Math.exp(-x / 0.45)); });
  }

  // Each trace: a signal and how to fit it into a lane (value -> roughly -1..1).
  var TRACES = [
    { fn: eeg, mid: 0, span: 1.35 },
    { fn: ecg, mid: 0.38, span: 0.9 },
    { fn: ppg, mid: 0.52, span: 0.66 },
    { fn: resp, mid: 0, span: 1.2 },
    { fn: eda, mid: 0.55, span: 0.95 },
    { fn: pupil, mid: 0.5, span: 0.85 }
  ];

  // Words in the language lane: [start, duration, isStimulus] within one period.
  var WORDS = [[0.2, 0.5], [0.85, 0.35], [1.3, 0.55], [2.0, 0.7, 1], [2.85, 0.4], [3.4, 0.6],
    [4.15, 0.3], [4.6, 0.55], [5.3, 0.5]];

  var colors = lanes.map(function (el) {
    return getComputedStyle(el).getPropertyValue("--c").trim() || "#ffffff";
  });
  var parts = {
    brain: panel.querySelector(".ic-brain"),
    heart: panel.querySelector(".ic-heart"),
    led: panel.querySelector(".ic-led"),
    lungs: panel.querySelector(".ic-lungs"),
    drop: panel.querySelector(".ic-drop"),
    pupil: panel.querySelector(".ic-pupil"),
    bubble: panel.querySelector(".ic-bubble")
  };

  var W = 0, H = 0, laneH = 0, speed = 70;

  function measure() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    laneH = H / lanes.length;
    speed = W < 420 ? 44 : 70;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    var xNow = W - 14;
    var t0 = now - xNow / speed;
    function xOf(time) { return xNow - (now - time) * speed; }

    // Stimulus markers across every lane
    ctx.save();
    ctx.strokeStyle = "rgba(246, 244, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (var k = Math.floor((t0 - ONSET) / PERIOD); k * PERIOD + ONSET <= now; k++) {
      var sx = Math.round(xOf(k * PERIOD + ONSET)) + 0.5;
      if (sx < 0) continue;
      ctx.beginPath();
      ctx.moveTo(sx, 6);
      ctx.lineTo(sx, H - 6);
      ctx.stroke();
    }
    ctx.restore();

    // Six continuous traces
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (var i = 0; i < TRACES.length; i++) {
      var tr = TRACES[i], cy = laneH * (i + 0.5), amp = laneH * 0.36, y = 0;
      ctx.beginPath();
      for (var x = 0; x <= xNow; x += 1) {
        var v = tr.fn(t0 + x / speed);
        y = cy - ((v - tr.mid) / tr.span) * amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 12;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(xNow, y, 3.2, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Language lane: words as blocks, the stimulus word filled in
    var li = lanes.length - 1, wy = laneH * (li + 0.5), wh = Math.min(16, laneH * 0.36);
    for (var c = Math.floor(t0 / PERIOD); c * PERIOD <= now; c++) {
      for (var w = 0; w < WORDS.length; w++) {
        var start = c * PERIOD + WORDS[w][0];
        if (start > now) continue;
        var x1 = xOf(start), x2 = Math.min(xOf(start + WORDS[w][1]), xNow);
        if (x2 < 0 || x2 - x1 < 2) continue;
        roundRect(x1, wy - wh / 2, x2 - x1, wh, Math.min(4, (x2 - x1) / 2));
        ctx.globalAlpha = WORDS[w][2] ? 1 : 0.3;
        ctx.fillStyle = colors[li];
        if (WORDS[w][2]) { ctx.shadowColor = colors[li]; ctx.shadowBlur = 10; }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
  }

  // The icons move with their signals.
  function animateIcons(now) {
    var beat = gauss(frac(beatPhase(now)), 0.3, 0.07);
    var since = frac((now - ONSET) / PERIOD) * PERIOD;
    if (parts.heart) parts.heart.style.transform = "scale(" + (1 + 0.16 * beat).toFixed(3) + ")";
    if (parts.lungs) parts.lungs.style.transform = "scale(" + (1 + 0.07 * resp(now)).toFixed(3) + ")";
    if (parts.led) parts.led.style.opacity = Math.min(1, 0.25 + 0.7 * ppg(now)).toFixed(2);
    if (parts.brain) parts.brain.style.fillOpacity = (0.08 + 0.42 * alpha(now)).toFixed(2);
    if (parts.drop) parts.drop.style.fillOpacity = Math.max(0.1, Math.min(0.9, 0.2 + 0.5 * eda(now))).toFixed(2);
    if (parts.pupil) parts.pupil.setAttribute("r", Math.max(1.6, Math.min(4, 2.3 + 1.2 * pupil(now))).toFixed(2));
    if (parts.bubble) parts.bubble.style.fillOpacity = (since < 0.7 ? 0.7 : 0.12).toFixed(2);
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var running = false, visible = true, base = 46.6;
  var startedAt = null;

  function frame(ms) {
    if (!running) return;
    if (startedAt === null) startedAt = ms;
    var now = base + (ms - startedAt) / 1000;
    draw(now);
    animateIcons(now);
    window.requestAnimationFrame(frame);
  }

  function play() {
    if (reduce || running || !visible || document.hidden) return;
    running = true;
    window.requestAnimationFrame(frame);
  }

  function pause(ms) {
    if (!running) return;
    running = false;
    if (startedAt !== null) {
      base += ((ms || window.performance.now()) - startedAt) / 1000;
      startedAt = null;
    }
  }

  function still() {
    measure();
    draw(base);
    animateIcons(base);
  }

  still();
  window.addEventListener("resize", function () {
    measure();
    if (!running) { draw(base); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(); else play();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) play(); else pause();
    }).observe(canvas);
  }
  play();
})();
