// Draws a synthetic lead II rhythm strip on ECG paper scale:
// 25 mm/s and 10 mm/mV, with a 1 mV calibration pulse at the start.
(function () {
  var canvas = document.getElementById("ecg");
  if (!canvas || !canvas.getContext) return;

  var MM = 6;                 // CSS pixels per millimetre (matches --mm)
  var PX_PER_S = 25 * MM;     // paper speed
  var PX_PER_MV = 10 * MM;    // gain
  var BEAT = 0.86;            // seconds per beat (about 70 bpm)

  // P, Q, R, S, T as Gaussians: [amplitude mV, centre s, width s]
  var WAVES = [
    [0.16, -0.2, 0.026],
    [-0.12, -0.036, 0.01],
    [1.25, 0, 0.011],
    [-0.28, 0.034, 0.011],
    [0.34, 0.25, 0.046]
  ];

  function mv(t) {
    var phase = t - Math.round(t / BEAT) * BEAT;
    var v = 0;
    for (var k = -1; k <= 1; k++) {
      var p = phase + k * BEAT;
      for (var i = 0; i < WAVES.length; i++) {
        var w = WAVES[i];
        var d = (p - w[1]) / w[2];
        v += w[0] * Math.exp(-0.5 * d * d);
      }
    }
    return v;
  }

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealed = reduce ? 1 : 0;
  var started = false;

  function draw() {
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var ink = getComputedStyle(canvas).color || "#14123a";
    var base = Math.round(h * 0.68 / MM) * MM;   // baseline on a grid line
    var x0 = 4 * MM;                             // lead-in before the pulse
    var calW = 5 * MM;                           // 0.2 s
    var startX = x0 + calW + 6 * MM;             // where the rhythm begins

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w * revealed, h);
    ctx.clip();

    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, base);
    ctx.lineTo(x0, base);
    ctx.lineTo(x0, base - PX_PER_MV);            // 1 mV calibration pulse
    ctx.lineTo(x0 + calW, base - PX_PER_MV);
    ctx.lineTo(x0 + calW, base);
    ctx.lineTo(startX, base);
    for (var x = startX; x <= w; x += 0.5) {
      var t = (x - startX) / PX_PER_S - 0.36;    // first beat lands after the lead-in
      ctx.lineTo(x, base - mv(t) * PX_PER_MV);
    }
    ctx.stroke();
    ctx.restore();
  }

  function sweep() {
    if (started) return;
    started = true;
    if (reduce) {
      draw();
      return;
    }
    var t0 = null;
    var DURATION = 2400;
    function frame(now) {
      if (t0 === null) t0 = now;
      revealed = Math.min(1, (now - t0) / DURATION);
      draw();
      if (revealed < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      if (started) draw();
    }, 80);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(sweep, sweep);
    window.setTimeout(sweep, 1200);
  } else {
    sweep();
  }
})();
