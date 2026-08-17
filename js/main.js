/* eden* 赏析站 —— 交互脚本 */
(function () {
  "use strict";

  document.body.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ 星空（星辰 + 光尘 + 红星 + 流星 + 鼠标视差） ============ */
  function makeStars(canvas, opts) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var stars = [], dust = [], w, h, dpr;
    var mx = 0, my = 0, tmx = 0, tmy = 0; // 鼠标视差
    var parallax = opts && opts.parallax;
    var RED = { x: 0.78, y: 0.24 }; // 灭世之星的相对位置

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = []; dust = [];
      var n = Math.floor((w * h) / 5200);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.15 + .25,
          p: Math.random() * Math.PI * 2,
          s: .4 + Math.random() * 1.1,
          depth: .3 + Math.random() * .7
        });
      }
      var dn = Math.floor((w * h) / 26000);
      for (var j = 0; j < dn; j++) {
        dust.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.8 + .8,
          p: Math.random() * Math.PI * 2,
          vy: .08 + Math.random() * .18,
          depth: .2 + Math.random() * .5
        });
      }
    }

    if (parallax && !reduceMotion) {
      canvas.closest("section, header") && window.addEventListener("mousemove", function (e) {
        tmx = (e.clientX / window.innerWidth - .5) * 2;
        tmy = (e.clientY / window.innerHeight - .5) * 2;
      }, { passive: true });
    }

    var t = 0, shoot = null, nextShoot = 260;
    function draw() {
      t += 1;
      mx += (tmx - mx) * .04; my += (tmy - my) * .04;
      ctx.clearRect(0, 0, w, h);

      // 光尘（金色，缓缓上浮）
      for (var d0 = 0; d0 < dust.length; d0++) {
        var du = dust[d0];
        du.y -= du.vy;
        if (du.y < -8) { du.y = h + 8; du.x = Math.random() * w; }
        var a2 = reduceMotion ? .18 : (.1 + .12 * Math.abs(Math.sin(du.p + t * .008)));
        ctx.globalAlpha = a2;
        ctx.fillStyle = "#c9b27c";
        ctx.beginPath();
        ctx.arc(du.x + mx * 14 * du.depth, du.y + my * 10 * du.depth, du.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 普通星辰
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var tw = reduceMotion ? .8 : (.45 + .55 * Math.abs(Math.sin(st.p + t * .012 * st.s)));
        ctx.globalAlpha = tw * .9;
        ctx.fillStyle = "#dfe6f5";
        ctx.beginPath();
        ctx.arc(st.x + mx * 26 * st.depth, st.y + my * 18 * st.depth, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 灭世之星（红）
      var rx = w * RED.x + mx * 8, ry = h * RED.y + my * 6;
      var pulse = reduceMotion ? .6 : (.5 + .5 * Math.sin(t * .014));
      var halo = ctx.createRadialGradient(rx, ry, 0, rx, ry, 46 + 26 * pulse);
      halo.addColorStop(0, "rgba(214, 96, 84, " + (.5 + .22 * pulse) + ")");
      halo.addColorStop(.35, "rgba(184, 80, 69, " + (.16 + .1 * pulse) + ")");
      halo.addColorStop(1, "rgba(184, 80, 69, 0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = halo;
      ctx.fillRect(rx - 80, ry - 80, 160, 160);
      ctx.fillStyle = "#e08a7d";
      ctx.beginPath();
      ctx.arc(rx, ry, 2.1 + .5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 流星
      if (!reduceMotion) {
        if (!shoot && t > nextShoot) {
          shoot = { x: Math.random() * w * .7 + w * .15, y: Math.random() * h * .3, life: 0 };
        }
        if (shoot) {
          shoot.life += 1;
          var sx = shoot.x + shoot.life * 5.2, sy = shoot.y + shoot.life * 2.4;
          var grad = ctx.createLinearGradient(sx - 62, sy - 28, sx, sy);
          grad.addColorStop(0, "rgba(223, 230, 245, 0)");
          grad.addColorStop(1, "rgba(223, 230, 245, .8)");
          ctx.strokeStyle = grad; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx - 62, sy - 28); ctx.lineTo(sx, sy); ctx.stroke();
          if (shoot.life > 60) { shoot = null; nextShoot = t + 400 + Math.random() * 700; }
        }
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", function () {
      resize();
      if (reduceMotion) draw();
    });
    requestAnimationFrame(draw);
  }

  var heroCanvas = document.getElementById("starfield");
  if (heroCanvas) makeStars(heroCanvas, { parallax: true });
  document.querySelectorAll("canvas[data-stars]").forEach(function (c) { makeStars(c); });

  /* ============ 滚动显现 ============ */
  var revealTargets = document.querySelectorAll(".reveal, .timeline, .sec-divider");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ 数字滚动 ============ */
  var countTargets = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    if (!reduceMotion) countTargets.forEach(function (el) { el.textContent = "0"; });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = parseInt(el.getAttribute("data-count"), 10) || 0;
        cio.unobserve(el);
        if (reduceMotion) { el.textContent = target; return; }
        var start = null, dur = 1600;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          p = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * p);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: .5 });
    countTargets.forEach(function (el) { cio.observe(el); });
  } else {
    countTargets.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* ============ 导航高亮 / 深色区适配 / 返回顶部 ============ */
  var progressBar = document.getElementById("progressBar");
  var toTop = document.getElementById("toTop");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".side-nav a"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  var darkSections = Array.prototype.slice.call(document.querySelectorAll(".hero, .section-deep, .finale"));

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";

    if (toTop) toTop.classList.toggle("show", window.scrollY > window.innerHeight * .8);

    var y = window.scrollY + window.innerHeight * .42;
    var active = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].offsetTop <= y) active = i;
    }
    navLinks.forEach(function (a, i) {
      var isActive = i === active;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });

    var mid = window.scrollY + window.innerHeight * .5, onDark = false;
    for (var d = 0; d < darkSections.length; d++) {
      var s = darkSections[d], top = s.offsetTop, bot = top + s.offsetHeight;
      if (mid > top && mid < bot) { onDark = true; break; }
    }
    document.body.classList.toggle("on-dark", onDark);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ============ 剧透之门 ============ */
  var gate = document.getElementById("spoilerGate");
  var story = document.getElementById("storyBody");
  var openBtn = document.getElementById("spoilerOpen");
  if (gate && story && openBtn) {
    openBtn.addEventListener("click", function () {
      story.classList.add("open");
      gate.style.transition = "opacity .6s ease";
      gate.style.opacity = "0";
      setTimeout(function () { gate.remove(); }, 650);
      setTimeout(function () {
        story.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
        story.focus({ preventScroll: true });
      }, 50);
    });
  }

  /* ============ 音乐坞 ============ */
  var dock = document.getElementById("musicDock");
  var bgm = document.getElementById("bgm");
  var mdPlay = document.getElementById("mdPlay");
  var mdTitle = document.getElementById("mdTitle");
  var tracks = [
    { src: "assets/audio/edenBGM026_A.mp3", title: "eden* 终章" },
    { src: "assets/audio/edenBGM021.mp3", title: "eden* 主旋律" },
    { src: "assets/audio/edenBGM020.mp3", title: "eden* 桃源" },
    { src: "assets/audio/edenBGM024.mp3", title: "eden* 抉择" },
    { src: "assets/audio/edenBGM015.mp3", title: "eden* 谢幕" },
    { src: "assets/audio/edenBGM017.mp3", title: "eden* 探访" },
    { src: "assets/audio/edenBGM003.mp3", title: "eden* 孤岛" },
    { src: "assets/audio/edenBGM012.mp3", title: "eden* 姐妹" }
  ];
  var trackIdx = 0;
  var wantPlay = false; // 期望处于播放状态（切歌后据此自动续播）

  function loadTrack(i) {
    trackIdx = (i + tracks.length) % tracks.length;
    bgm.src = tracks[trackIdx].src;
    mdTitle.textContent = tracks[trackIdx].title;
  }
  function startPlay() {
    wantPlay = true;
    var p = bgm.play();
    if (p && p.then) {
      p.then(function () {
        mdPlay.classList.add("playing");
        mdPlay.classList.remove("pulse");
        mdPlay.setAttribute("aria-pressed", "true");
        mdPlay.setAttribute("aria-label", "暂停音乐");
        dock.classList.add("active");
        mdTitle.textContent = tracks[trackIdx].title;
      }).catch(function () {
        mdPlay.classList.remove("playing");
        mdPlay.classList.add("pulse");
        mdPlay.setAttribute("aria-pressed", "false");
        mdPlay.setAttribute("aria-label", "播放音乐");
        mdTitle.textContent = "点一下页面任意处，音乐即响起";
      });
    }
  }
  function stopPlay() {
    wantPlay = false;
    bgm.pause();
    mdPlay.classList.remove("playing");
    mdPlay.setAttribute("aria-pressed", "false");
    mdPlay.setAttribute("aria-label", "播放音乐");
  }
  mdPlay.addEventListener("click", function () {
    if (bgm.paused || !wantPlay) startPlay(); else stopPlay();
  });
  document.getElementById("mdPrev").addEventListener("click", function () {
    loadTrack(trackIdx - 1);
    if (wantPlay) startPlay(); else mdTitle.textContent = tracks[trackIdx].title;
  });
  document.getElementById("mdNext").addEventListener("click", function () {
    loadTrack(trackIdx + 1);
    if (wantPlay) startPlay(); else mdTitle.textContent = tracks[trackIdx].title;
  });
  bgm.addEventListener("ended", function () {
    loadTrack(trackIdx + 1);
    if (wantPlay) startPlay();
  });
  loadTrack(0);
  // 自动播放：尽力尝试；被浏览器拦截则等待首次交互（Chrome 不允许无点击出声）
  function autoStart() {
    if (bgm.paused && wantPlay !== false) startPlay();
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach(function (ev) {
      window.removeEventListener(ev, autoStart);
    });
  }
  window.addEventListener("load", function () {
    startPlay();
    setTimeout(function () {
      if (bgm.paused) {
        ["pointerdown", "keydown", "touchstart", "wheel"].forEach(function (ev) {
          window.addEventListener(ev, autoStart, { passive: true });
        });
      }
    }, 800);
  });

  /* ============ OP 海报点击加载播放器 ============ */
  var opPoster = document.getElementById("opPoster");
  if (opPoster) {
    opPoster.addEventListener("click", function () {
      var holder = document.getElementById("opPlayer");
      var f = document.createElement("iframe");
      f.src = "https://player.bilibili.com/player.html?bvid=BV1WP4y1w73v&autoplay=1&high_quality=1&danmaku=0";
      f.setAttribute("allowfullscreen", "");
      f.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      f.setAttribute("scrolling", "no");
      f.title = "eden* OP little explorer 4K 修复版";
      holder.innerHTML = "";
      holder.appendChild(f);
    });
  }

  /* ============ 灯箱 ============ */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbCount = document.getElementById("lbCount");
  var items = Array.prototype.slice.call(document.querySelectorAll(".g-item img"));
  var cur = 0;
  var lastFocus = null;
  var previousOverflow = "";

  function openLb(i) {
    var wasOpen = lb.classList.contains("show");
    if (!wasOpen) {
      lastFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
    }
    cur = (i + items.length) % items.length;
    lbImg.src = items[cur].src;
    lbImg.alt = items[cur].alt || "";
    lbCap.textContent = items[cur].getAttribute("data-cap") || "";
    lbCount.textContent = String(cur + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
    lb.hidden = false;
    lb.classList.add("show");
    document.body.style.overflow = "hidden";
    if (!wasOpen) document.getElementById("lbClose").focus();
    // 预加载相邻图
    var pre = new Image();
    pre.src = items[(cur + 1) % items.length].src;
  }
  function closeLb() {
    if (!lb.classList.contains("show")) return;
    lb.classList.remove("show");
    lb.hidden = true;
    document.body.style.overflow = previousOverflow;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }
  items.forEach(function (img, i) {
    img.parentElement.addEventListener("click", function () { openLb(i); });
  });
  document.getElementById("lbClose").addEventListener("click", closeLb);
  document.getElementById("lbPrev").addEventListener("click", function (e) { e.stopPropagation(); openLb(cur - 1); });
  document.getElementById("lbNext").addEventListener("click", function (e) { e.stopPropagation(); openLb(cur + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("show")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") openLb(cur - 1);
    if (e.key === "ArrowRight") openLb(cur + 1);
    if (e.key === "Tab") {
      var focusable = [
        document.getElementById("lbClose"),
        document.getElementById("lbPrev"),
        document.getElementById("lbNext")
      ];
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
