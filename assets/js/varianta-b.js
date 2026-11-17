/* cotton / varianta B
   Singura mișcare: parallax. Trecerea închis-deschis, scena din catalog și
   restul sunt stări (0,3s / 0,5s / 0,6s), nu animații.                    */
(function () {
  "use strict";

  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var desk = matchMedia("(min-width: 1021px)");
  var body = document.body;

  /* ------------------------------------------- tema, după secțiunea din mijloc
     Radian: pagina trece din închis în deschis acolo unde contează culoarea. */
  if ("IntersectionObserver" in window) {
    var themed = document.querySelectorAll("[data-theme]:not(body)");
    var themeIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) body.dataset.theme = e.target.dataset.theme;
      });
    }, { rootMargin: "-49% 0px -49% 0px" });
    themed.forEach(function (s) { themeIO.observe(s); });
  }

  /* -------------------------------------------------------------- header */
  var hd = document.getElementById("hd");
  function headerState() { hd && hd.classList.toggle("is-solid", scrollY > 10); }
  addEventListener("scroll", headerState, { passive: true });
  headerState();

  /* --------------------------------------------------------- sertar mobil */
  var drawer = document.getElementById("drawer");
  var burger = document.getElementById("burger");
  var closeBtn = document.getElementById("drawerClose");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-on", open);
    burger && burger.setAttribute("aria-expanded", String(open));
    body.style.overflow = open ? "hidden" : "";
    if (open && closeBtn) closeBtn.focus();
    if (!open && burger && drawer.contains(document.activeElement)) burger.focus();
  }
  burger && burger.addEventListener("click", function () { setDrawer(true); });
  closeBtn && closeBtn.addEventListener("click", function () { setDrawer(false); });
  drawer && drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setDrawer(false); });
  addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });

  /* -------------------------------------------------------------- parallax
     Poziția se măsoară din layout, fără transformare, ca să nu se hrănească
     singur. Haina din hero rămâne în urmă când pagina pleacă în sus.       */
  var movers = [];
  function measure() {
    movers = [].map.call(document.querySelectorAll("[data-speed]"), function (el) {
      el.style.transform = "";
      var r = el.getBoundingClientRect();
      return { el: el, s: parseFloat(el.dataset.speed) || 0, mid: r.top + scrollY + r.height / 2 };
    });
  }
  var ticking = false;
  function paint() {
    ticking = false;
    var vmid = scrollY + innerHeight / 2;
    movers.forEach(function (m) {
      m.el.style.transform = "translate3d(0," + ((m.mid - vmid) * m.s).toFixed(1) + "px,0)";
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  function setupParallax() {
    removeEventListener("scroll", onScroll);
    document.querySelectorAll("[data-speed]").forEach(function (el) { el.style.transform = ""; });
    if (reduce.matches || innerWidth < 760) return;
    measure(); paint();
    addEventListener("scroll", onScroll, { passive: true });
  }
  addEventListener("load", setupParallax);
  addEventListener("resize", function () { clearTimeout(setupParallax.t); setupParallax.t = setTimeout(setupParallax, 150); });
  setupParallax();

  /* --------------------------------------------- hero: tunica, apoi cu broderie
     Cu mouse-ul: la hover peste tunică apare aceeași tunică, cu logoul brodat.
     Pe touch și de la tastatură comută butonul de sub ea (sau o atingere).   */
  var hero = document.querySelector(".hero");
  var obj = document.getElementById("heroObj");
  var ctl = document.getElementById("heroCtl");
  var heroCap = document.getElementById("heroCap");
  var CAP_OFF = heroCap ? heroCap.textContent : "";
  var CAP_ON = "Același model, cu logoul brodat pe piept";
  function setEmb(on) {
    if (!hero) return;
    hero.classList.toggle("is-emb", on);
    if (ctl) {
      ctl.setAttribute("aria-pressed", String(on));
      ctl.textContent = on ? "Vezi fără broderie" : "Vezi cu broderie";
    }
    if (heroCap) heroCap.textContent = on ? CAP_ON : CAP_OFF;
  }
  if (obj) {
    obj.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") setEmb(true); });
    obj.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") setEmb(false); });
    obj.addEventListener("click", function () {
      if (!matchMedia("(hover: hover)").matches) setEmb(!hero.classList.contains("is-emb"));
    });
  }
  ctl && ctl.addEventListener("click", function () { setEmb(!hero.classList.contains("is-emb")); });

  /* --------------------------------------------------------- scena catalog
     Pe desktop, scroll-ul prin secțiune alege categoria: patru pași egali. */
  var stage = document.getElementById("catalog");
  var slides = stage ? stage.querySelectorAll(".slide") : [];
  var dots = stage ? stage.querySelectorAll("[data-go]") : [];
  var num = document.getElementById("stageNum");
  var active = -1;
  function show(i) {
    if (i === active) return;
    active = i;
    slides.forEach(function (s, k) {
      var on = k === i;
      s.classList.toggle("is-on", on);
      if (desk.matches) { s.inert = !on; } else { s.inert = false; }
    });
    dots.forEach(function (d, k) { d.classList.toggle("is-on", k === i); d.setAttribute("aria-pressed", String(k === i)); });
    if (num) num.textContent = (i + 1) + " / " + slides.length;
  }
  function onStage() {
    if (!stage || !desk.matches) return;
    var r = stage.getBoundingClientRect();
    var span = stage.offsetHeight - innerHeight;
    var p = Math.min(.9999, Math.max(0, -r.top / span));
    show(Math.floor(p * slides.length));
  }
  function stageMode() {
    active = -1;
    if (desk.matches) { onStage(); }
    else { slides.forEach(function (s) { s.inert = false; s.classList.add("is-on"); }); }
  }
  if (stage) {
    addEventListener("scroll", onStage, { passive: true });
    desk.addEventListener ? desk.addEventListener("change", stageMode) : desk.addListener(stageMode);
    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        var i = +d.dataset.go;
        var span = stage.offsetHeight - innerHeight;
        var top = stage.getBoundingClientRect().top + scrollY + span * (i + .5) / slides.length;
        scrollTo({ top: top, behavior: reduce.matches ? "auto" : "smooth" });
      });
    });
    stageMode();
  }

  /* ---------------------------------------------------------------- calcul
     Scara de pe site: de la 3 buc. 5%, de la 6 buc. 10%, de la 9 buc. 15%,
     de la 12 buc. 20%. Broderia (de la 50 MDL/buc.) e separată, fără reducere,
     și face suma „de la”.                                                  */
  var model = document.getElementById("cModel");
  var qty = document.getElementById("cQty");
  var emb = document.getElementById("cEmb");
  var unitEl = document.getElementById("cUnit");
  var totalEl = document.getElementById("cTotal");
  var note = document.getElementById("cNote");
  var steps = document.querySelectorAll("#steps .step");
  var NB = " ";
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB) + " MDL"; }
  function discount(q) { return q >= 12 ? 20 : q >= 9 ? 15 : q >= 6 ? 10 : q >= 3 ? 5 : 0; }
  var notes = {
    0: "Preț întreg. Reducerea începe de la 3 bucăți.",
    5: "Reducere 5%. De la 6 bucăți ar fi 10%.",
    10: "Reducere 10%. De la 9 bucăți ar fi 15%.",
    15: "Reducere 15%. De la 12 bucăți ar fi 20%.",
    20: "Reducere 20%, cea mai mare de pe scară."
  };
  function calc() {
    if (!model) return;
    var q = Math.max(1, Math.min(999, parseInt(qty.value, 10) || 1));
    var d = discount(q);
    var unit = +model.value * (1 - d / 100) + (emb.checked ? 50 : 0);
    var from = emb.checked ? "de la " : "";
    unitEl.textContent = from + money(unit);
    totalEl.textContent = from + money(unit * q);
    note.textContent = notes[d] + " Calcul după prețurile de pe site.";
    steps.forEach(function (s) {
      var min = +s.dataset.min, next = s.nextElementSibling ? +s.nextElementSibling.dataset.min : Infinity;
      s.classList.toggle("is-on", q >= min && q < next);
    });
  }
  if (model) {
    [model, emb].forEach(function (el) { el.addEventListener("change", calc); });
    qty.addEventListener("input", calc);
    qty.addEventListener("blur", function () { qty.value = Math.max(1, Math.min(999, parseInt(qty.value, 10) || 1)); calc(); });
    document.getElementById("cMinus").addEventListener("click", function () { qty.value = Math.max(1, (+qty.value || 1) - 1); calc(); });
    document.getElementById("cPlus").addEventListener("click", function () { qty.value = Math.min(999, (+qty.value || 0) + 1); calc(); });
    calc();
    var ask = document.getElementById("cAsk");
    var msg = document.getElementById("fMsg");
    ask && ask.addEventListener("click", function () {
      if (!msg) return;
      var name = model.options[model.selectedIndex].text.split(" / ")[0];
      msg.value = name + ", " + (parseInt(qty.value, 10) || 1) + " buc." + (emb.checked ? ", cu broderie de logo." : ".");
    });
  }

  /* ------------------------------------------------------------- formular
     Machetă: nu există încă un backend, deci nu trimitem nimic.            */
  var form = document.getElementById("form");
  var out = document.getElementById("formMsg");
  form && form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = form.elements.name, p = form.elements.phone;
    if (!n.value.trim() || !p.value.trim()) {
      out.textContent = "Completați numele și telefonul, ca să vă putem suna.";
      (n.value.trim() ? p : n).focus();
      return;
    }
    out.textContent = "Machetă: formularul nu trimite încă nimic.";
  });
})();
