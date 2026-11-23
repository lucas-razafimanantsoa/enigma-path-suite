/* EnigmaPath home: a light, low-cost ICT/maths background animation.
 * A slow constellation, drifting binary/maths glyphs and a sine trace with
 * small travelling packets. The page's graph-paper grid is CSS; this canvas
 * adds the motion. Honours prefers-reduced-motion and pauses when hidden. */
(function () {
  'use strict';

  var canvas = document.getElementById('hub-bg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1;
  var bits = [];
  var nodes = [];
  var packets = [];
  var GLYPHS = ['0', '1', '+', '=', '∑', '√', '<', '>', '≠', '∧', 'π'];
  var last = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw(0);
  }

  function seed() {
    bits = [];
    var count = Math.min(22, Math.max(10, Math.round(W / 74)));
    for (var i = 0; i < count; i++) {
      bits.push({
        x: Math.random() * W,
        y: Math.random() * H,
        g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        s: 11 + Math.random() * 8,
        v: 0.08 + Math.random() * 0.16,
        a: 0.13 + Math.random() * 0.16
      });
    }

    nodes = [];
    var nodeCount = W < 620 ? 5 : 8;
    for (var j = 0; j < nodeCount; j++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.82,
        vx: (Math.random() - 0.5) * 0.11,
        vy: (Math.random() - 0.5) * 0.11,
        r: 2 + Math.random() * 2.2
      });
    }

    packets = [];
    for (var k = 0; k < 3; k++) {
      packets.push({
        x: Math.random() * W,
        speed: 0.22 + Math.random() * 0.25,
        offset: Math.random() * Math.PI * 2,
        size: 1.6 + Math.random() * 1.1
      });
    }
  }

  function sineY(x, t, offset) {
    return H - 56 + Math.sin(x / 130 + t / 2600 + offset) * 18
      + Math.sin(x / 47 - t / 3900) * 7;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Slow sine traces near the bottom.
    for (var s = 0; s < 2; s++) {
      ctx.beginPath();
      for (var x = 0; x <= W; x += 8) {
        var y = sineY(x, t, s * 1.7);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = s === 0 ? 'rgba(70, 130, 180, 0.22)' : 'rgba(70, 130, 180, 0.12)';
      ctx.lineWidth = s === 0 ? 1.5 : 1;
      ctx.stroke();
    }

    // Travelling packets on the first trace.
    for (var p = 0; p < packets.length; p++) {
      var pk = packets[p];
      ctx.beginPath();
      ctx.arc(pk.x, sineY(pk.x, t, pk.offset), pk.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(70, 130, 180, 0.42)';
      ctx.fill();
    }

    // Linked constellation.
    for (var i = 0; i < nodes.length; i++) {
      for (var k = i + 1; k < nodes.length; k++) {
        var dx = nodes[i].x - nodes[k].x, dy = nodes[i].y - nodes[k].y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          ctx.strokeStyle = 'rgba(70, 130, 180, ' + (0.17 * (1 - d2 / 22000)).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[k].x, nodes[k].y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(70, 130, 180, 0.34)';
      ctx.beginPath();
      ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drifting glyphs.
    ctx.font = '600 14px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    for (var b = 0; b < bits.length; b++) {
      var bit = bits[b];
      ctx.fillStyle = 'rgba(58, 111, 153, ' + bit.a.toFixed(3) + ')';
      ctx.fillText(bit.g, bit.x, bit.y);
    }
  }

  function step(t) {
    if (document.hidden) {
      requestAnimationFrame(step);
      return;
    }
    if (t - last > 33) {
      last = t;
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        b.y -= b.v;
        if (b.y < -20) { b.y = H + 20; b.x = Math.random() * W; }
      }
      for (var j = 0; j < nodes.length; j++) {
        var n = nodes[j];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H * 0.85) n.vy *= -1;
      }
      for (var k = 0; k < packets.length; k++) {
        var pk = packets[k];
        pk.x += pk.speed;
        if (pk.x > W + 12) pk.x = -12;
      }
      draw(t);
    }
    requestAnimationFrame(step);
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !reduced) last = 0;
  });
  if (!reduced) requestAnimationFrame(step);
}());
