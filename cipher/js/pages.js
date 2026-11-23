/* ==========================================================================
   Enigmatica — pages
   Every page is a small template + optional setup function. The router swaps
   them into #app. Hash routing keeps the whole thing portable on file://.
   ========================================================================== */
(function (global) {
  "use strict";

  const ALPHABET = Ciphers.ALPHABET;
  const icon = UI.icon;
  const esc = UI.escapeHtml;

  const SAMPLE_PLAIN = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE RAIN IN SPAIN FALLS MAINLY ON THE PLAIN";
  const SAMPLE_SHIFT = 11;

  const KASISKI = {
    cipher: "TXIOFELQPRDXATGTQQGVEAMGGSIICEDXATGTQQGVEAMGGSIMURZJIWFOSYWGHEEHUPESSBQJACYTWTBRDWUHJLWFVRPTAQUZJNSYTIRWGHEEHUPIBCPSSRWANVQRHWMFMVEAMGGSIESNDSZCSWMSVGTXIOFELQGRLWABBQHMFXYIEGVEAMGGSIEDETRSCSSSBSVEAMGGSIIWAEIDCSOIEDNTVISULHQJRCCFVVYKNSSZVQIFHITOQYSFVVYKNSSZVQIFHIISEPEXZTZMZUQTVQQGESTSNGIZKRHIDSNWPSCVYKPWEPGFHUPSFVRCAMM",
    plain: "IT WAS THE BEST OF TIMES IT WAS THE WORST OF TIMES IT WAS THE AGE OF WISDOM IT WAS THE AGE OF FOOLISHNESS IT WAS THE EPOCH OF BELIEF IT WAS THE EPOCH OF INCREDULITY IT WAS THE SEASON OF LIGHT IT WAS THE SEASON OF DARKNESS IT WAS THE SPRING OF HOPE IT WAS THE WINTER OF DESPAIR WE HAD EVERYTHING BEFORE US WE HAD NOTHING BEFORE US WE WERE ALL GOING DIRECT TO HEAVEN WE WERE ALL GOING DIRECT THE OTHER WAY",
    freq: [
      { key: "L", shift: 11, top: [["T", 9], ["E", 9], ["S", 7], ["P", 6]] },
      { key: "E", shift: 4, top: [["I", 14], ["S", 7], ["A", 6], ["V", 5]] },
      { key: "M", shift: 12, top: [["Q", 9], ["M", 8], ["I", 7], ["E", 6]] },
      { key: "O", shift: 14, top: [["S", 10], ["G", 9], ["C", 7], ["W", 6]] },
      { key: "N", shift: 13, top: [["G", 11], ["R", 8], ["V", 8], ["F", 5]] }
    ]
  };

  function page(html, setup) {
    return { html: html, setup: setup || null };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function charsLabel(n) {
    return n + (n === 1 ? " char" : " chars");
  }

  function onCleanup(fn) {
    if (global.App && typeof global.App.onCleanup === "function") {
      global.App.onCleanup(fn);
    }
  }

  function bindRunShortcut(root, run) {
    if (!root) return;
    root.addEventListener("keydown", function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        run();
      }
    });
  }

  function idleConsole(text) {
    return '<div class="status-line"><span class="prompt">&gt;</span> ' + text +
      '<span class="status-cursor"></span></div>';
  }

  function setOutputPlaceholder(output, text) {
    output.innerHTML = '<span class="output-placeholder">' + esc(text) + "</span>";
  }

  /* ==========================================================================
     Home
     ========================================================================== */
  function homePage() {
    const html = `
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><span class="dot"></span> local cipher engine // v1.0</div>
          <h1><span class="grad">Enigmatica.</span><br>Messages, <span class="grad-teal">masked.</span></h1>
          <p class="lede">A tiny cipher lab for the classically curious. Encrypt, decrypt, and break Caesar &amp; Vigenère ciphers — entirely in your browser, with zero server gossip.</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" href="#/caesar">${icon("lock")} Start with Caesar <span class="arr">→</span></a>
            <a class="btn btn-ghost btn-lg" href="#/vigenere">${icon("key")} Try Vigenère</a>
          </div>
          <div class="hero-meta">
            <span>${icon("shield")} 100% client-side</span>
            <span>${icon("chip")} nerd font</span>
            <span>${icon("flask")} EnigmaPath palette</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-dial" aria-hidden="true"></div>
          <div class="hero-dial-core" aria-hidden="true">A<span>→</span>D</div>
          <span class="float-glyph" style="top:9%;left:3%;--delay:0s" aria-hidden="true">A</span>
          <span class="float-glyph" style="top:34%;left:8%;--delay:2s" aria-hidden="true">7</span>
          <span class="float-glyph" style="top:68%;left:4%;--delay:4s" aria-hidden="true">∑</span>
          <span class="float-glyph" style="top:12%;right:2%;--delay:1.4s" aria-hidden="true">Z</span>
          <span class="float-glyph" style="bottom:18%;right:0;--delay:3.2s" aria-hidden="true">→</span>
          <span class="float-glyph" style="bottom:4%;left:31%;--delay:5.2s" aria-hidden="true">k</span>

          <div class="terminal" aria-label="Example Enigmatica cipher session">
            <div class="term-bar">
              <span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
              <span>~/enigmatica</span>
              <span class="term-live">● local</span>
            </div>
            <div class="term-body">
              <div class="term-line"><span class="prompt">$</span> enigmatica --init</div>
              <div class="term-line term-dim">loading cipher engine <span class="term-ok">... ok</span></div>
              <div class="term-line"><span class="prompt">&gt;</span> caesar.rot(3)</div>
              <div class="term-out"><span class="from">HELLO</span><span class="arr">→</span><span class="to" data-scramble="KHOOR">KHOOR</span></div>
              <div class="term-line"><span class="prompt">&gt;</span> vigenere.key(<span class="term-glow">"LEMON"</span>)</div>
              <div class="term-out"><span class="from">ATTACKATDAWN</span><span class="arr">→</span><span class="to" data-scramble="LXFOPVEFRNHR">LXFOPVEFRNHR</span></div>
              <div class="term-line term-dim">ready <span class="term-cursor"></span></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <span class="kicker">01 // choose your cipher</span>
            <h2>What are we hiding today?</h2>
          </div>
          <span class="section-rule"></span>
          <span class="pill">2 ciphers · 1 cracker</span>
        </div>

        <div class="menu-grid">
          <a class="menu-card" data-watermark="A→D" href="#/caesar">
            <div class="card-top">
              <span class="card-icon">${icon("gears")}</span>
              <span class="card-tag">monoalphabetic</span>
            </div>
            <h3>Caesar cipher</h3>
            <p>Shift every letter by a fixed amount. The classic. Elegant, ancient, and breakable in exactly 26 tries.</p>
            <div class="card-foot">
              <span>encrypt / decrypt <span class="arr">→</span></span>
              <span class="card-glyph">k ∈ [0, 25]</span>
            </div>
          </a>

          <a class="menu-card vigenere" data-watermark="LEMON" href="#/vigenere">
            <div class="card-top">
              <span class="card-icon">${icon("key")}</span>
              <span class="card-tag">polyalphabetic</span>
            </div>
            <h3>Vigenère cipher</h3>
            <p>A keyword drives a different shift for every letter. Once called “le chiffre indéchiffrable” — until it wasn't.</p>
            <div class="card-foot">
              <span>encrypt / decrypt <span class="arr">→</span></span>
              <span class="card-glyph">key = LEMON</span>
            </div>
          </a>
        </div>

        <div class="crack-banner">
          <div class="crack-copy">
            <div class="crack-icon">${icon("eyeOff")}</div>
            <div>
              <span class="kicker">02 // no key? no problem</span>
              <h2>Decrypt without a key.</h2>
              <p>Caesar falls to a 26-shift brute force with a language score. Vigenère needs a little more detective work — Kasiski is on the case (soon).</p>
            </div>
          </div>
          <div class="crack-actions">
            <a class="btn btn-primary" href="#/crack/caesar">${icon("bolt")} Crack Caesar</a>
            <a class="btn btn-ghost" href="#/crack/vigenere">${icon("search")} Kasiski · soon</a>
          </div>
        </div>

        <div class="notes-strip">
          <a class="note-link" href="#/learn/caesar">
            ${icon("book")}
            <span><b>How Caesar works</b><span>history · wheel · frequency</span></span>
            <span class="arr">→</span>
          </a>
          <a class="note-link" href="#/learn/vigenere">
            ${icon("table")}
            <span><b>How Vigenère works</b><span>tabula recta · keyword</span></span>
            <span class="arr">→</span>
          </a>
          <a class="note-link" href="#/learn/kasiski">
            ${icon("search")}
            <span><b>Kasiski examination</b><span>repeats · distances · key length</span></span>
            <span class="arr">→</span>
          </a>
        </div>
      </section>
    `;

    function setup() {
      const nodes = document.querySelectorAll("[data-scramble]");
      nodes.forEach(function (node, index) {
        const finalText = node.getAttribute("data-scramble") || "";
        if (UI.prefersReducedMotion()) {
          node.textContent = finalText;
          return;
        }
        node.textContent = "·".repeat(finalText.length);
        UI.scrambleTo(node, finalText, {
          delay: 850 + index * 520,
          duration: 620,
          maxAnimated: 40
        });
      });
    }

    return page(html, setup);
  }

  /* ==========================================================================
     Cipher workspaces
     ========================================================================== */
  const CIPHER_META = {
    caesar: {
      title: "Caesar cipher",
      sub: "A fixed shift, a classic secret. Pick a key from 0 to 25, then encrypt or decrypt.",
      icon: "gears",
      learn: "#/learn/caesar",
      crack: "#/crack/caesar"
    },
    vigenere: {
      title: "Vigenère cipher",
      sub: "A keyword repeats under your message, shifting each letter differently. Poly­alphabetic, properly paranoid.",
      icon: "key",
      learn: "#/learn/vigenere",
      crack: "#/crack/vigenere"
    }
  };

  function keyFieldHtml(cipher) {
    if (cipher === "caesar") {
      return `
        <div class="field">
          <label for="caesar-key">Shift key <span class="dim">(0–25)</span></label>
          <div class="key-control key-control-caesar">
            <button class="stepper" type="button" data-step="-1" aria-label="Decrease shift">−</button>
            <input class="key-number" id="caesar-key" type="number" min="0" max="25" step="1" value="3" inputmode="numeric" autocomplete="off">
            <button class="stepper" type="button" data-step="1" aria-label="Increase shift">+</button>
            <input type="range" id="caesar-range" min="0" max="25" step="1" value="3" aria-label="Shift key slider">
            <span class="key-badge">k = <b id="key-readout">3</b></span>
          </div>
          <div class="alpha-strip" aria-label="Alphabet shift preview">
            <div class="alpha-row plain" id="alpha-plain"></div>
            <div class="alpha-row shift" id="alpha-shift"></div>
          </div>
          <div class="alpha-labels"><span>plaintext alphabet</span><span>ciphertext alphabet</span></div>
        </div>
      `;
    }

    return `
      <div class="field">
        <label for="vigenere-key">Keyword <span class="dim">(letters only)</span></label>
        <div class="key-control">
          <input class="text-key" id="vigenere-key" type="text" value="LEMON" maxlength="64" autocomplete="off" spellcheck="false" aria-describedby="key-meta">
          <span class="key-badge">period <b id="key-period">5</b></span>
          <span class="key-meta" id="key-meta">repeats every 5 letters</span>
        </div>
        <div class="key-tape-wrap">
          <div class="key-tape" id="key-tape" aria-hidden="true"></div>
        </div>
        <div class="alpha-labels"><span>key stream, repeated under the message</span><span>spaces &amp; symbols are skipped</span></div>
      </div>
    `;
  }

  function sideHtml(cipher) {
    if (cipher === "caesar") {
      return `
        <div class="panel mini-panel">
          <span class="kicker">the formula</span>
          <div class="formula">C = (P + k) mod 26<small>decrypt: P = (C − k) mod 26</small></div>
          <p>Each letter moves <b>k</b> places forward, wrapping from Z back to A. Punctuation, spaces and digits stay put.</p>
        </div>
        <div class="panel mini-panel">
          <span class="kicker">quick example · k=3</span>
          <div class="example-mini"><span class="from">HELLO</span><span class="arr">→</span><span class="to">KHOOR</span></div>
          <p>H→K, E→H, L→O, L→O, O→R. Same shift for every single letter.</p>
        </div>
        <div class="panel mini-panel tip">
          <span class="kicker">field note</span>
          <p>Only 26 keys exist. The no-key cracker simply tries every one and scores the results.</p>
          <div class="side-links">
            <a href="#/crack/caesar">${icon("bolt")} open brute force</a>
            <a href="#/learn/caesar">${icon("book")} read the theory</a>
          </div>
        </div>
      `;
    }

    return `
      <div class="panel mini-panel">
        <span class="kicker">the formula</span>
        <div class="formula">C<sub>i</sub> = (P<sub>i</sub> + K<sub>i</sub>) mod 26<small>decrypt: P<sub>i</sub> = (C<sub>i</sub> − K<sub>i</sub>) mod 26</small></div>
        <p>The keyword repeats. Each key letter supplies a different Caesar shift for the matching message letter.</p>
      </div>
      <div class="panel mini-panel">
        <span class="kicker">quick example</span>
        <div class="example-mini"><span class="from">ATTACKATDAWN</span><span class="arr">+</span><span class="to">LEMON</span></div>
        <p>With key <b>LEMON</b>, the plaintext becomes <span class="accent-teal">LXFOPVEFRNHR</span>. Every fifth letter reuses L.</p>
      </div>
      <div class="panel mini-panel tip">
        <span class="kicker">field note</span>
        <p>Vigenère flattens letter frequencies, but a repeating key leaves a statistical fingerprint.</p>
        <div class="side-links">
          <a href="#/learn/vigenere">${icon("table")} see the tabula recta</a>
          <a href="#/learn/kasiski">${icon("search")} kasiski examination</a>
        </div>
      </div>
    `;
  }

  function cipherPage(cipher) {
    const meta = CIPHER_META[cipher];
    const other = cipher === "caesar" ? "vigenere" : "caesar";
    const html = `
      <div class="breadcrumb">
        <a href="#/">~</a><span class="sep">/</span><span>${cipher}</span>
      </div>

      <div class="page-head">
        <div class="page-title-row">
          <div class="page-icon">${icon(meta.icon)}</div>
          <div>
            <h1>${meta.title}</h1>
            <p class="sub">${meta.sub}</p>
          </div>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-ghost btn-sm" href="${meta.learn}">${icon("book")} How it works</a>
          <a class="btn btn-ghost btn-sm" href="${meta.crack}">${icon("bolt")} Crack it</a>
        </div>
      </div>

      <div class="workspace">
        <section class="panel workspace-main" id="workspace">
          <div class="workspace-top">
            <div class="segmented" role="group" aria-label="Operation mode">
              <button type="button" data-mode="encrypt" class="is-active" aria-pressed="true"><span class="mode-mark">↑</span> Encrypt</button>
              <button type="button" data-mode="decrypt" aria-pressed="false"><span class="mode-mark">↓</span> Decrypt</button>
            </div>
            <div class="workspace-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run</div>
          </div>

          ${keyFieldHtml(cipher)}

          <div class="io-grid">
            <div class="io-block">
              <div class="io-head">
                <label for="message-input">Message</label>
                <div class="io-tools">
                  <span class="char-count" id="char-count">0 chars</span>
                  <button class="mini-action" type="button" id="clear-btn">clear</button>
                </div>
              </div>
              <textarea class="message-input" id="message-input" spellcheck="false" placeholder="Type the plaintext you want to hide…"></textarea>
            </div>

            <div class="io-arrow" aria-hidden="true"><span class="arrow-ring">→</span></div>

            <div class="io-block">
              <div class="io-head">
                <span class="io-label">Output</span>
                <div class="io-tools">
                  <button class="mini-action" type="button" id="copy-btn">copy</button>
                  <button class="mini-action" type="button" id="swap-btn">swap ⇄</button>
                </div>
              </div>
              <div class="output-box" id="output-box" role="textbox" aria-readonly="true" aria-multiline="true" aria-label="Output"><span class="output-placeholder">Encrypted text will appear here.</span></div>
              <div class="sr-only" id="output-live" aria-live="polite"></div>
            </div>
          </div>

          <div class="run-progress" id="run-progress"><span></span></div>

          <div class="run-row">
            <div class="status-console" id="status-console" aria-live="polite">${idleConsole("idle. waiting for input")}</div>
            <button class="btn btn-primary run-btn" id="run-btn" type="button">${icon("lock")} <span>Encrypt</span></button>
          </div>
        </section>

        <aside class="workspace-side">
          ${sideHtml(cipher)}
          <div class="panel mini-panel">
            <span class="kicker">keep exploring</span>
            <div class="side-links">
              <a href="#/crack">${icon("eyeOff")} decrypt without a key</a>
              <a href="#/${other}">${icon("exchange")} switch to ${other}</a>
              <a href="#/about">${icon("info")} about this lab</a>
            </div>
          </div>
        </aside>
      </div>
    `;

    function setup() {
      const workspace = document.getElementById("workspace");
      const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
      const input = document.getElementById("message-input");
      const output = document.getElementById("output-box");
      const outputLive = document.getElementById("output-live");
      const charCount = document.getElementById("char-count");
      const status = document.getElementById("status-console");
      const runBtn = document.getElementById("run-btn");
      const clearBtn = document.getElementById("clear-btn");
      const copyBtn = document.getElementById("copy-btn");
      const swapBtn = document.getElementById("swap-btn");
      const progress = document.getElementById("run-progress");
      const progressBar = progress ? progress.querySelector("span") : null;

      let mode = "encrypt";
      let running = false;
      let currentOutput = "";

      function updateCharCount() {
        const count = Array.from(input.value).length;
        charCount.textContent = charsLabel(count);
      }

      function resetOutput(placeholder) {
        currentOutput = "";
        setOutputPlaceholder(output, placeholder);
        output.classList.remove("is-running", "is-done");
        outputLive.textContent = "";
      }

      function setIdle(text) {
        status.innerHTML = idleConsole(text);
      }

      function setMode(nextMode, clear) {
        mode = nextMode;
        modeButtons.forEach(function (button) {
          const active = button.getAttribute("data-mode") === mode;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-pressed", active ? "true" : "false");
        });

        const encrypting = mode === "encrypt";
        runBtn.innerHTML = icon(encrypting ? "lock" : "unlock") + " <span>" + (encrypting ? "Encrypt" : "Decrypt") + "</span>";
        input.placeholder = encrypting
          ? "Type the plaintext you want to hide…"
          : "Paste the ciphertext you want to reveal…";

        if (clear !== false) {
          resetOutput(encrypting ? "Encrypted text will appear here." : "Decrypted text will appear here.");
          setIdle("mode set to " + mode + ". waiting for input");
        }
      }

      /* ---------- key handling ---------- */
      let getKey = function () { return 0; };
      let renderKey = function () {};

      if (cipher === "caesar") {
        const keyInput = document.getElementById("caesar-key");
        const range = document.getElementById("caesar-range");
        const readout = document.getElementById("key-readout");
        const alphaPlain = document.getElementById("alpha-plain");
        const alphaShift = document.getElementById("alpha-shift");
        const steppers = Array.from(document.querySelectorAll(".stepper"));

        function clampShift(value) {
          const n = Math.trunc(Number(value));
          if (!Number.isFinite(n)) return 0;
          return Math.max(0, Math.min(25, n));
        }

        function renderAlphabet(shift) {
          alphaPlain.innerHTML = "";
          alphaShift.innerHTML = "";
          for (let i = 0; i < 26; i += 1) {
            const plain = document.createElement("span");
            plain.textContent = ALPHABET[i];
            alphaPlain.appendChild(plain);
            const shifted = document.createElement("span");
            shifted.textContent = ALPHABET[(i + shift) % 26];
            alphaShift.appendChild(shifted);
          }
        }

        function applyShift(shift, syncNumber) {
          const n = clampShift(shift);
          if (syncNumber) keyInput.value = String(n);
          range.value = String(n);
          readout.textContent = String(n);
          UI.setRangeFill(range);
          renderAlphabet(n);
          return n;
        }

        getKey = function () {
          return clampShift(keyInput.value);
        };

        keyInput.addEventListener("input", function () {
          if (keyInput.value === "") {
            applyShift(0, true);
            return;
          }
          applyShift(keyInput.value, true);
        });
        keyInput.addEventListener("blur", function () {
          applyShift(getKey(), true);
        });
        range.addEventListener("input", function () {
          applyShift(range.value, true);
        });
        steppers.forEach(function (button) {
          button.addEventListener("click", function () {
            const step = Number(button.getAttribute("data-step")) || 0;
            applyShift(getKey() + step, true);
          });
        });

        applyShift(3, true);
      } else {
        const keyInput = document.getElementById("vigenere-key");
        const period = document.getElementById("key-period");
        const keyMeta = document.getElementById("key-meta");
        const tape = document.getElementById("key-tape");

        function renderTape() {
          const raw = keyInput.value;
          const key = Ciphers.cleanKey(raw);
          period.textContent = key ? String(key.length) : "—";

          if (!key) {
            keyMeta.textContent = "letters A–Z only";
          } else if (Ciphers.cleanKey(raw) !== raw.toUpperCase()) {
            keyMeta.textContent = "symbols ignored · repeats every " + key.length + " letter" + (key.length === 1 ? "" : "s");
          } else {
            keyMeta.textContent = "repeats every " + key.length + " letter" + (key.length === 1 ? "" : "s");
          }

          tape.innerHTML = "";
          if (!key) {
            const hint = document.createElement("span");
            hint.className = "dim";
            hint.style.border = "0";
            hint.style.background = "transparent";
            hint.style.width = "auto";
            hint.textContent = "type a keyword…";
            tape.appendChild(hint);
            return;
          }

          for (let i = 0; i < 36; i += 1) {
            if (i > 0 && i % key.length === 0) {
              const gap = document.createElement("span");
              gap.className = "tape-gap";
              tape.appendChild(gap);
            }
            const letter = document.createElement("span");
            letter.textContent = key[i % key.length];
            tape.appendChild(letter);
          }
        }

        getKey = function () {
          return Ciphers.cleanKey(keyInput.value);
        };
        renderKey = renderTape;

        keyInput.addEventListener("input", renderTape);
        keyInput.addEventListener("blur", function () {
          keyInput.value = Ciphers.cleanKey(keyInput.value);
          renderTape();
        });

        renderTape();
      }

      /* ---------- actions ---------- */
      async function runCipher() {
        if (running) return;

        const text = input.value;
        if (!text.trim()) {
          UI.toast("Type a message first.", "warn");
          input.focus();
          return;
        }

        let key;
        if (cipher === "caesar") {
          key = getKey();
        } else {
          key = getKey();
          if (!key) {
            UI.toast("Add a keyword using letters A–Z.", "warn");
            document.getElementById("vigenere-key").focus();
            return;
          }
        }

        const computeStart = performance.now();
        const result = cipher === "caesar"
          ? Ciphers.caesar(text, key, mode)
          : Ciphers.vigenere(text, key, mode);
        const computeMs = performance.now() - computeStart;

        running = true;
        runBtn.disabled = true;
        output.classList.remove("is-done");
        output.classList.add("is-running");
        output.textContent = "";
        currentOutput = result;

        if (progressBar) {
          progress.classList.add("is-active");
          progressBar.style.transitionDuration = "0s";
          progressBar.style.width = "0%";
          void progressBar.offsetWidth;
          progressBar.style.transitionDuration = "0.85s";
          progressBar.style.width = "100%";
        }

        const lines = cipher === "caesar"
          ? [
              '> <span class="hl">caesar.' + mode + '</span>(shift=' + key + ")",
              '> transforming <span class="hl">' + Array.from(text).length + "</span> characters…"
            ]
          : [
              '> <span class="hl">vigenere.' + mode + '</span>(key="' + key + '")',
              '> key stream <span class="hl">' + key + "</span> · " + Array.from(text).length + " characters…"
            ];

        try {
          const consolePromise = UI.writeConsole(status, lines, { interval: 95 });
          const animation = UI.scrambleTo(output, result, {
            duration: 840,
            direction: mode === "decrypt" ? "rtl" : "ltr",
            maxAnimated: 650
          });

          await Promise.all([consolePromise, animation]);

          status.innerHTML =
            '<div class="status-line"><span class="prompt">&gt;</span> <span class="ok">done</span> · cipher ' +
            UI.formatMs(computeMs) + " · " + charsLabel(Array.from(text).length) + "</div>" +
            '<div class="status-line"><span class="prompt">&gt;</span> ' +
            (mode === "encrypt" ? "ciphertext" : "plaintext") +
            ' ready. copy or swap.<span class="status-cursor"></span></div>';

          output.classList.remove("is-running");
          UI.flash(output, "is-done", 900);
          outputLive.textContent = (mode === "encrypt" ? "Encrypted" : "Decrypted") +
            " output ready. " + result.slice(0, 280);

          if (progressBar) {
            setTimeout(function () {
              progress.classList.remove("is-active");
              progressBar.style.width = "0%";
            }, 260);
          }
        } finally {
          running = false;
          runBtn.disabled = false;
        }
      }

      async function copyOutput() {
        if (!currentOutput) {
          UI.toast("Nothing to copy yet — run the cipher first.", "warn");
          return;
        }
        const ok = await UI.copyText(currentOutput);
        if (ok) {
          UI.toast("Copied to clipboard.", "good");
          const previous = copyBtn.textContent;
          copyBtn.textContent = "copied";
          setTimeout(function () { copyBtn.textContent = previous; }, 1300);
        } else {
          UI.toast("Copy failed — select the output manually.", "warn");
        }
      }

      function clearAll() {
        if (running) return;
        input.value = "";
        updateCharCount();
        resetOutput(mode === "encrypt" ? "Encrypted text will appear here." : "Decrypted text will appear here.");
        setIdle("cleared. waiting for input");
        input.focus();
      }

      function swapSides() {
        if (running) return;
        if (!currentOutput) {
          UI.toast("Run the cipher first, then swap the result into the input.", "warn");
          return;
        }
        const nextMode = mode === "encrypt" ? "decrypt" : "encrypt";
        input.value = currentOutput;
        setMode(nextMode, false);
        resetOutput(nextMode === "encrypt" ? "Encrypted text will appear here." : "Decrypted text will appear here.");
        setIdle("swapped. output moved to input, mode flipped to " + nextMode);
        updateCharCount();
        input.focus();
      }

      /* ---------- wiring ---------- */
      modeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          if (running) return;
          const next = button.getAttribute("data-mode");
          if (next === mode) return;
          setMode(next, true);
        });
      });

      input.addEventListener("input", updateCharCount);
      runBtn.addEventListener("click", runCipher);
      clearBtn.addEventListener("click", clearAll);
      copyBtn.addEventListener("click", copyOutput);
      swapBtn.addEventListener("click", swapSides);
      bindRunShortcut(workspace, runCipher);

      updateCharCount();
      setMode("encrypt", false);
      resetOutput("Encrypted text will appear here.");
      setIdle("idle. waiting for input");

      /* ---------- handoff from the keyless cracker ---------- */
      const handoff = UI.takeHandoff();
      if (handoff && handoff.cipher === cipher && handoff.text) {
        if (cipher === "caesar") {
          const keyInput = document.getElementById("caesar-key");
          const range = document.getElementById("caesar-range");
          keyInput.value = String(handoff.shift);
          range.value = String(handoff.shift);
          range.dispatchEvent(new Event("input", { bubbles: true }));
        }
        input.value = handoff.text;
        updateCharCount();
        setMode("decrypt", false);
        resetOutput("Decrypted text will appear here.");
        setIdle("handoff loaded · shift " + handoff.shift + " · press run");
        UI.toast("Shift " + handoff.shift + " loaded from the cracker.", "good");
      }
    }

    return page(html, setup);
  }

  /* ==========================================================================
     Decrypt without a key — landing
     ========================================================================== */
  function crackLandingPage() {
    const html = `
      <div class="breadcrumb">
        <a href="#/">~</a><span class="sep">/</span><span>no-key</span>
      </div>

      <div class="page-head">
        <div class="page-title-row">
          <div class="page-icon">${icon("eyeOff")}</div>
          <div>
            <h1>Decrypt without a key</h1>
            <p class="sub">Keys are optional. Cleverness is not. Two ways to open a message you were never given the key for.</p>
          </div>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-ghost btn-sm" href="#/learn/kasiski">${icon("book")} The math</a>
        </div>
      </div>

      <div class="crack-landing">
        <article class="crack-card">
          <div class="crack-card-top">
            <div class="crack-card-icon">${icon("bolt")}</div>
            <span class="pill green">ready</span>
          </div>
          <h2>Caesar brute force</h2>
          <p>Try all 26 shifts against the first words of the message. A small English-language heuristic points at the most readable candidate. One click, zero key.</p>
          <div class="card-foot">
            <span class="dim">26 shifts · first words · match score</span>
            <a href="#/crack/caesar">Run the cracker ${icon("arrowRight")}</a>
          </div>
        </article>

        <article class="crack-card soon">
          <div class="crack-card-top">
            <div class="crack-card-icon">${icon("search")}</div>
            <span class="pill yellow">yet to come</span>
          </div>
          <h2>Vigenère / Kasiski</h2>
          <p>A repeating keyword leaves repeated fragments in the ciphertext. Measure the distances, factor them, and the key length starts to show itself.</p>
          <div class="card-foot">
            <span class="dim">repeats · distances · frequency analysis</span>
            <a href="#/crack/vigenere">Read the plan ${icon("arrowRight")}</a>
          </div>
        </article>
      </div>

      <div class="crack-note">
        ${icon("info")}
        <span>The Caesar cracker is live. The Vigenère cracker is still in the lab — the Kasiski page explains the full attack it will use, with a worked example.</span>
      </div>
    `;
    return page(html, null);
  }

  /* ==========================================================================
     Caesar brute force
     ========================================================================== */
  function caesarCrackPage() {
    const html = `
      <div class="breadcrumb">
        <a href="#/">~</a><span class="sep">/</span><a href="#/crack">no-key</a><span class="sep">/</span><span>caesar</span>
      </div>

      <div class="page-head">
        <div class="page-title-row">
          <div class="page-icon">${icon("bolt")}</div>
          <div>
            <h1>Caesar brute force</h1>
            <p class="sub">All 26 shifts, applied to the first words of the message. The most English-looking line wins.</p>
          </div>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-ghost btn-sm" href="#/crack">${icon("arrowLeft")} No-key menu</a>
          <a class="btn btn-ghost btn-sm" href="#/learn/caesar">${icon("book")} How it works</a>
        </div>
      </div>

      <section class="panel scan-panel">
        <div class="scan-input-row">
          <div>
            <label class="kicker" for="crack-input" style="margin-bottom:7px">Ciphertext</label>
            <textarea class="message-input" id="crack-input" spellcheck="false" placeholder="Paste the Caesar ciphertext you want to crack…"></textarea>
            <div class="scan-meta">
              <span>${icon("info")} inspecting the first <b>8 words</b> · max 64 chars</span>
              <span id="crack-count">0 chars</span>
            </div>
          </div>
          <div class="scan-side">
            <button class="btn btn-primary" id="crack-run" type="button">${icon("search")} Run 26 shifts</button>
            <button class="btn btn-ghost" id="sample-btn" type="button">${icon("file")} Use sample</button>
            <button class="btn btn-quiet" id="clear-crack" type="button">clear</button>
          </div>
        </div>

        <div class="run-progress" id="crack-progress"><span></span></div>
        <div class="status-console" id="crack-status" style="margin-top:12px" aria-live="polite">${idleConsole("ready. paste a ciphertext or load the sample")}</div>

        <div class="results" id="results" hidden>
          <div class="results-head">
            <span>shift</span>
            <span>first words, decrypted</span>
            <span>match</span>
          </div>
          <div class="results-list" id="results-list"></div>
        </div>

        <div class="crack-note">
          ${icon("bulb")}
          <span>The score is a heuristic, not a verdict. Short messages can be ambiguous. Click any row to open that shift in the Caesar workspace with the full message loaded.</span>
        </div>
      </section>
    `;

    function setup() {
      const input = document.getElementById("crack-input");
      const count = document.getElementById("crack-count");
      const runBtn = document.getElementById("crack-run");
      const sampleBtn = document.getElementById("sample-btn");
      const clearBtn = document.getElementById("clear-crack");
      const status = document.getElementById("crack-status");
      const results = document.getElementById("results");
      const list = document.getElementById("results-list");
      const progress = document.getElementById("crack-progress");
      const progressBar = progress.querySelector("span");
      let running = false;

      function updateCount() {
        count.textContent = charsLabel(Array.from(input.value).length);
      }

      function reset() {
        results.hidden = true;
        list.innerHTML = "";
        status.innerHTML = idleConsole("ready. paste a ciphertext or load the sample");
      }

      async function runCrack() {
        if (running) return;
        const text = input.value;
        if (!text.trim()) {
          UI.toast("Paste a ciphertext first.", "warn");
          input.focus();
          return;
        }
        if (!/[A-Za-z]/.test(text)) {
          UI.toast("Add some letters to crack.", "warn");
          input.focus();
          return;
        }

        running = true;
        runBtn.disabled = true;
        results.hidden = false;
        list.innerHTML = "";

        progress.classList.add("is-active");
        progressBar.style.transitionDuration = "0s";
        progressBar.style.width = "0%";
        void progressBar.offsetWidth;
        progressBar.style.transitionDuration = "0.75s";
        progressBar.style.width = "100%";

        const candidates = Ciphers.rankCaesar(text, { maxWords: 8, maxChars: 64 });
        const best = candidates.find(function (candidate) { return candidate.isBest; }) || candidates[0];

        const consolePromise = UI.writeConsole(status, [
          '> scanning <span class="hl">26 shifts</span> against the first words…',
          '> scoring english likelihood…'
        ], { interval: 105 });

        const animations = [];
        candidates.forEach(function (candidate, index) {
          const row = document.createElement("button");
          row.type = "button";
          row.className = "result-row" + (candidate.isBest ? " is-best" : "");
          row.style.setProperty("--d", (index * 14) + "ms");
          row.dataset.shift = String(candidate.shift);
          row.setAttribute("aria-label", "Shift " + candidate.shift + ": " + candidate.preview);

          row.innerHTML =
            '<span class="shift-badge">+' + pad2(candidate.shift) + "</span>" +
            '<span class="result-preview"><span class="preview-text"></span>' +
            (candidate.isBest ? '<span class="best-tag">likely</span>' : "") + "</span>" +
            '<span class="result-score"><span class="score-track"><i class="score-fill"></i></span>' +
            '<span class="score-label">' + candidate.confidence + '%</span>' +
            '<span class="result-open">open →</span></span>';

          list.appendChild(row);

          const previewText = row.querySelector(".preview-text");
          previewText.textContent = candidate.preview;
          animations.push(UI.scrambleTo(previewText, candidate.preview, {
            delay: index * 14,
            duration: 500,
            maxAnimated: 72
          }));

          requestAnimationFrame(function () {
            const fill = row.querySelector(".score-fill");
            if (fill) fill.style.width = candidate.confidence + "%";
          });

          row.addEventListener("click", function () {
            UI.saveHandoff({ cipher: "caesar", text: text, shift: candidate.shift });
            global.location.hash = "#/caesar";
          });
        });

        try {
          await Promise.all([consolePromise].concat(animations));
          status.innerHTML =
            '<div class="status-line"><span class="prompt">&gt;</span> <span class="ok">best guess</span> · shift ' +
            best.shift + " · " + best.confidence + "% match</div>" +
            '<div class="status-line"><span class="prompt">&gt;</span> click a row to open it in the caesar workspace.<span class="status-cursor"></span></div>';
          progress.classList.remove("is-active");
          progressBar.style.width = "0%";
          results.scrollIntoView({
            behavior: UI.prefersReducedMotion() ? "auto" : "smooth",
            block: "nearest"
          });
        } finally {
          running = false;
          runBtn.disabled = false;
        }
      }

      input.addEventListener("input", updateCount);
      input.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          runCrack();
        }
      });
      runBtn.addEventListener("click", runCrack);
      sampleBtn.addEventListener("click", function () {
        if (running) return;
        input.value = Ciphers.caesar(SAMPLE_PLAIN, SAMPLE_SHIFT, "encrypt");
        updateCount();
        reset();
        UI.toast("Sample ciphertext loaded. The shift is your job.", "info");
      });
      clearBtn.addEventListener("click", function () {
        if (running) return;
        input.value = "";
        updateCount();
        reset();
        input.focus();
      });

      updateCount();
    }

    return page(html, setup);
  }

  /* ==========================================================================
     Kasiski / Vigenère keyless page
     ========================================================================== */
  function kasiskiPage(comingSoon) {
    const html = `
      <div class="breadcrumb">
        <a href="#/">~</a><span class="sep">/</span>
        ${comingSoon ? '<a href="#/crack">no-key</a><span class="sep">/</span><span>vigenère</span>' : '<a href="#/learn/vigenere">vigenère</a><span class="sep">/</span><span>kasiski</span>'}
      </div>

      <div class="page-head">
        <div class="page-title-row">
          <div class="page-icon">${icon("search")}</div>
          <div>
            <h1>${comingSoon ? "Breaking Vigenère" : "The Kasiski examination"}</h1>
            <p class="sub">Find the key length first. Then each column becomes a tiny Caesar cipher.</p>
          </div>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-ghost btn-sm" href="${comingSoon ? "#/crack" : "#/learn/vigenere"}">${icon("arrowLeft")} ${comingSoon ? "No-key menu" : "Vigenère"}</a>
          <a class="btn btn-ghost btn-sm" href="#/crack/caesar">${icon("bolt")} Caesar cracker</a>
        </div>
      </div>

      ${comingSoon ? `
        <div class="coming-banner">
          <span class="coming-stamp">yet to come</span>
          <p>The automatic Vigenère cracker is still in the lab. This page is the plan it will follow — <b>Kasiski examination</b> plus per-column frequency analysis, illustrated with a real worked example.</p>
        </div>
      ` : ""}

      <article class="article">
        <div class="article-hero">
          <div>
            <span class="kicker">field notes // keyless attack</span>
            <h1>Repeated keys leave<br><span class="grad" style="background:linear-gradient(100deg,var(--yellow),var(--peach));-webkit-background-clip:text;background-clip:text;color:transparent">repeated fingerprints.</span></h1>
            <p class="lede">Kasiski examination does not guess the key. It measures the ciphertext, finds repeated fragments, and uses their distances to infer how long the keyword is. Once the length is known, the wall breaks into five little Caesar ciphers.</p>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="big-glyph">K</div>
            <div class="art-caption">distances · factors · key length</div>
          </div>
        </div>

        <h2><span class="num">01</span>The weakness: repetition</h2>
        <p>Vigenère encrypts with a keyword that repeats. If the same plaintext fragment appears at two positions separated by a multiple of the key length, the same key letters line up with it — and the ciphertext fragment repeats too.</p>
        <p>That is the crack in the armour. The ciphertext is <em>supposed</em> to look random, but a repeated key quietly reuses its shifts.</p>

        <div class="figure">
          <div class="cipher-tape" id="kasiski-tape" aria-label="Ciphertext with repeated sequences highlighted"></div>
          <div class="tape-legend">
            <span><i class="a"></i> TXI / XIO / IOF / FEL</span>
            <span><i class="b"></i> WGH / GHE / HEE</span>
            <span><i class="c"></i> DXA / XAT</span>
          </div>
          <div class="figure-caption">
            <b>Worked ciphertext.</b> First 180 letters, grouped in fives. The same colours mark repeated trigrams. The table below uses the full 319-letter ciphertext. The original plaintext is a passage from Dickens, encrypted with the key <b class="accent-yellow">LEMON</b>.
          </div>
        </div>

        <p>Repeated fragments and their distances:</p>
        <table class="example-table">
          <thead>
            <tr><th>repeated</th><th>positions</th><th>distance</th><th>factorisation</th></tr>
          </thead>
          <tbody>
            <tr><td class="mono hl">TXI</td><td>0, 150</td><td class="mono">150</td><td>2 · 3 · 5²</td></tr>
            <tr><td class="mono hl">WGH</td><td>58, 103</td><td class="mono">45</td><td>3² · 5</td></tr>
            <tr><td class="mono hl">DXA</td><td>10, 30</td><td class="mono">20</td><td>2² · 5</td></tr>
            <tr><td class="mono hl">SFV</td><td>246, 311</td><td class="mono">65</td><td>5 · 13</td></tr>
            <tr><td class="mono hl">FVR</td><td>87, 312</td><td class="mono">225</td><td>3² · 5²</td></tr>
            <tr><td class="mono hl">SII</td><td>25, 200</td><td class="mono">175</td><td>5² · 7</td></tr>
            <tr><td class="mono warn">SSB</td><td>67, 190</td><td class="mono">123</td><td>3 · 41 <span class="warn">← outlier</span></td></tr>
          </tbody>
        </table>

        <div class="callout warn">
          ${icon("info")}
          <p><b>Coincidences happen.</b> The distances 150, 45, 20, 65, 225 and 175 all share the factor <b class="accent-green">5</b>. The distance 123 does not, so it is probably an accidental repeat rather than a key-aligned one. Kasiski is a statistical attack, not a proof.</p>
        </div>

        <div class="figure">
          <span class="kicker">common factors</span>
          <div class="factor-chips">
            <span class="factor-chip">2</span><span class="factor-chip">3</span><span class="factor-chip common">5</span>
            <span class="factor-chip">7</span><span class="factor-chip">13</span><span class="factor-chip">17</span>
            <span class="factor-chip">19</span><span class="factor-chip">41</span>
          </div>
          <div class="figure-caption">Prime factors seen across the repeated distances. Only <b class="accent-green">5</b> divides every clean distance, so the keyword probably has length <b class="accent-green">5</b>. The actual key is <b class="accent-yellow">LEMON</b>.</div>
        </div>

        <h2><span class="num">02</span>Split the text into columns</h2>
        <p>If the key is five letters long, then letters 1, 6, 11, 16… were all encrypted with the same key letter. Pull every fifth letter into its own column:</p>

        <div class="figure">
          <div class="column-grid" id="column-grid" aria-label="First 50 ciphertext letters split into five columns"></div>
          <div class="figure-caption">First 50 letters arranged in five columns. Each column is a plain Caesar cipher — the same shift for every letter in that column.</div>
        </div>

        <h2><span class="num">03</span>Solve each column like Caesar</h2>
        <p>In normal English, <b>E</b> and <b>T</b> are the most common letters. In each column, find the most frequent ciphertext letter and try mapping it to E or T. The shift that produces readable text is the key letter for that column.</p>

        <div class="figure">
          <div class="freq-grid" id="freq-grid" aria-label="Frequency analysis of the five columns"></div>
          <div class="figure-caption">Top letters per column, taken from all 319 ciphertext letters. Matching the tallest peak to E or T recovers the key one column at a time.</div>
        </div>

        <div class="recovered-key">
          <span class="key-label">recovered key</span>
          <span class="key-arrow">→</span>
          <span class="key-letter">L</span><span class="key-letter">E</span><span class="key-letter">M</span><span class="key-letter">O</span><span class="key-letter">N</span>
          <span class="key-arrow">→</span>
          <span class="dim">decrypt the message</span>
        </div>

        <div class="callout good">
          ${icon("check")}
          <p><b>Why the columns work.</b> Each column contains only letters encrypted with one key letter. That is just a Caesar cipher, and Caesar falls to frequency analysis. Break five small Caesar ciphers, and the Vigenère key is yours.</p>
        </div>

        <h2><span class="num">04</span>Use the key</h2>
        <p>Now that the key length and the individual shifts are known, decrypt the whole message with the Vigenère workspace. The same key that looked unbreakable becomes a five-letter word.</p>
        <div class="letter-boxes" aria-label="Recovered key: LEMON">
          <span class="box cipher">L</span><span class="box cipher">E</span><span class="box cipher">M</span><span class="box cipher">O</span><span class="box cipher">N</span>
          <span class="box arrow">→</span>
          <span class="box cipher">LEMON</span>
        </div>
        <div class="hero-actions" style="margin-top:14px">
          <a class="btn btn-primary btn-sm" href="#/vigenere">${icon("key")} Open the Vigenère workspace</a>
          <a class="btn btn-ghost btn-sm" href="#/crack/caesar">${icon("bolt")} Try the Caesar cracker</a>
        </div>

        <div class="split">
          <div class="figure">
            <h3 style="margin-top:0">The short version</h3>
            <div class="steps" style="margin:0">
              <div class="step"><div><h3>Find repeated fragments</h3><p>Three or more letters that appear twice in the ciphertext.</p></div></div>
              <div class="step"><div><h3>Measure the distances</h3><p>Count letters between the starts of the repeats.</p></div></div>
              <div class="step"><div><h3>Factor the distances</h3><p>The key length is a common divisor — often the most plausible one.</p></div></div>
              <div class="step"><div><h3>Frequency-analyse each column</h3><p>Each column is a Caesar cipher. Solve them one by one.</p></div></div>
            </div>
          </div>
          <div class="figure">
            <h3 style="margin-top:0">Read more</h3>
            <p>Kasiski is usually paired with Friedman's index of coincidence, which gives another estimate of the key length.</p>
            <div class="side-links">
              <a href="https://en.wikipedia.org/wiki/Kasiski_examination" target="_blank" rel="noopener noreferrer">${icon("link")} Kasiski examination · Wikipedia</a>
              <a href="https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher" target="_blank" rel="noopener noreferrer">${icon("link")} Vigenère cipher · Wikipedia</a>
              <a href="https://en.wikipedia.org/wiki/Frequency_analysis" target="_blank" rel="noopener noreferrer">${icon("link")} Frequency analysis · Wikipedia</a>
              <a href="https://en.wikipedia.org/wiki/Index_of_coincidence" target="_blank" rel="noopener noreferrer">${icon("link")} Index of coincidence · Wikipedia</a>
            </div>
          </div>
        </div>

        ${comingSoon ? `
          <div class="callout">
            ${icon("wand")}
            <p><b>Meanwhile:</b> the Caesar cracker is fully armed and operational. It runs all 26 shifts and scores the results in your browser. <a href="#/crack/caesar">Try it →</a></p>
          </div>
        ` : ""}

        <div class="next-links">
          <a href="#/learn/vigenere">${icon("arrowLeft")} How Vigenère works</a>
          <a href="#/learn/caesar">${icon("book")} Caesar field notes</a>
          <a href="#/crack/caesar">${icon("bolt")} Try the Caesar cracker</a>
        </div>
      </article>
    `;

    function setup() {
      const tape = document.getElementById("kasiski-tape");
      const columnGrid = document.getElementById("column-grid");
      const freqGrid = document.getElementById("freq-grid");
      if (!tape || !columnGrid || !freqGrid) return;

      const ranges = [
        { start: 0, end: 7, cls: "hl-a" },
        { start: 150, end: 157, cls: "hl-a" },
        { start: 58, end: 63, cls: "hl-b" },
        { start: 103, end: 108, cls: "hl-b" },
        { start: 10, end: 14, cls: "hl-c" },
        { start: 30, end: 34, cls: "hl-c" }
      ];

      function classFor(index) {
        for (let i = 0; i < ranges.length; i += 1) {
          if (index >= ranges[i].start && index < ranges[i].end) return ranges[i].cls;
        }
        return "";
      }

      // Ciphertext tape: 60 letters per line, grouped in fives.
      for (let lineStart = 0; lineStart < 180; lineStart += 60) {
        const line = document.createElement("div");
        line.className = "tape-line";

        const pos = document.createElement("span");
        pos.className = "tape-pos";
        pos.textContent = String(lineStart).padStart(3, "0");
        line.appendChild(pos);

        const seq = document.createElement("span");
        seq.className = "tape-seq";
        const lineEnd = Math.min(lineStart + 60, 180);
        for (let i = lineStart; i < lineEnd; i += 1) {
          const ch = document.createElement("span");
          ch.textContent = KASISKI.cipher[i];
          const cls = classFor(i);
          if (cls) ch.className = cls;
          seq.appendChild(ch);
          if ((i + 1) % 5 === 0 && i + 1 < lineEnd) {
            seq.appendChild(document.createTextNode(" "));
          }
        }
        line.appendChild(seq);
        tape.appendChild(line);
      }

      // First 50 letters, arranged in five columns.
      const header = document.createElement("div");
      header.className = "col-head";
      header.textContent = "";
      columnGrid.appendChild(header);
      for (let c = 0; c < 5; c += 1) {
        const head = document.createElement("div");
        head.className = "col-head";
        head.textContent = "col " + (c + 1);
        columnGrid.appendChild(head);
      }

      for (let row = 0; row < 10; row += 1) {
        const label = document.createElement("div");
        label.className = "row-label";
        label.textContent = String(row * 5).padStart(2, "0");
        columnGrid.appendChild(label);
        for (let col = 0; col < 5; col += 1) {
          const cell = document.createElement("div");
          cell.className = "col-cell c" + (col + 1);
          cell.textContent = KASISKI.cipher[row * 5 + col];
          columnGrid.appendChild(cell);
        }
      }

      // Frequency analysis cards.
      KASISKI.freq.forEach(function (column, index) {
        const card = document.createElement("div");
        card.className = "freq-col";

        const head = document.createElement("div");
        head.className = "freq-col-head";
        head.innerHTML = "<span>col " + (index + 1) + "</span><b>" + column.key + "</b>";
        card.appendChild(head);

        const chart = document.createElement("div");
        chart.className = "freq-chart";
        const max = column.top[0][1];
        column.top.forEach(function (entry) {
          const bar = document.createElement("div");
          bar.className = "freq-bar";
          const height = Math.max(8, Math.round((entry[1] / max) * 100));
          bar.innerHTML = '<i style="--h:' + height + '%"></i><span>' + entry[0] + "</span><em>" + entry[1] + "</em>";
          chart.appendChild(bar);
        });
        card.appendChild(chart);

        const note = document.createElement("div");
        note.className = "dim";
        note.style.fontSize = "8px";
        note.style.marginTop = "5px";
        note.textContent = "shift +" + column.shift;
        card.appendChild(note);

        freqGrid.appendChild(card);
      });
    }

    return page(html, setup);
  }

  /* ==========================================================================
     Learn — Caesar
     ========================================================================== */
  function learnCaesarPage() {
    const englishBars = [
      ["E", 12.7], ["T", 9.1], ["A", 8.2], ["O", 7.5], ["I", 7.0],
      ["N", 6.7], ["S", 6.3], ["H", 6.1], ["R", 6.0], ["D", 4.3],
      ["L", 4.0], ["U", 2.8]
    ].map(function (entry) {
      return '<div class="freq-bar"><i style="--h:' + Math.round((entry[1] / 12.7) * 100) + '%"></i><span>' + entry[0] + "</span></div>";
    }).join("");

    const html = `
      <div class="breadcrumb">
        <a href="#/">~</a><span class="sep">/</span><a href="#/caesar">caesar</a><span class="sep">/</span><span>field notes</span>
      </div>

      <article class="article">
        <div class="article-hero">
          <div>
            <span class="kicker">field notes // 01</span>
            <h1>The Caesar cipher</h1>
            <p class="lede">A single number moves every letter of the alphabet. It is the oldest trick in the book — and the easiest to break.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#/caesar">${icon("lock")} Use the cipher</a>
              <a class="btn btn-ghost" href="#/crack/caesar">${icon("bolt")} Crack it</a>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="big-glyph">A→D</div>
            <div class="art-caption">shift 3 · julius approved</div>
          </div>
        </div>

        <h2><span class="num">01</span>A shift with a pedigree</h2>
        <p>Julius Caesar reportedly used a shift of three to protect military correspondence: <code>A</code> became <code>D</code>, <code>B</code> became <code>E</code>, and so on. The method is a <strong>monoalphabetic substitution</strong> — every plaintext letter maps to exactly one ciphertext letter, and the mapping never changes.</p>
        <p>That consistency is what makes it so easy to use. It is also what makes it so easy to break.</p>

        <h2><span class="num">02</span>The wheel</h2>
        <p>Imagine two alphabets on concentric rings. Turn the inner ring by <b>k</b> positions, then read each plaintext letter on the outer ring against its ciphertext partner on the inner ring. The wheel below is live — drag the slider.</p>

        <div class="figure">
          <div class="wheel-figure">
            <div class="wheel-stage">
              <svg class="cipher-wheel" id="caesar-wheel" viewBox="0 0 400 400" role="img" aria-label="Interactive Caesar cipher wheel"></svg>
            </div>
            <div>
              <div class="wheel-legend">
                <div class="legend-item"><span class="legend-dot"></span> outer ring · plaintext</div>
                <div class="legend-item"><span class="legend-dot cipher"></span> inner ring · ciphertext</div>
                <div class="legend-item"><span class="legend-dot highlight"></span> A and its current mapping</div>
              </div>
              <div class="wheel-readout" id="wheel-readout"><b>A → D</b> · shift 3 · <span class="accent-teal">HELLO → KHOOR</span></div>
              <div class="wheel-controls">
                <label for="wheel-shift" class="kicker" style="margin-bottom:7px">shift k</label>
                <input type="range" id="wheel-shift" min="0" max="25" step="1" value="3" aria-label="Caesar wheel shift">
              </div>
            </div>
          </div>
          <div class="figure-caption">Outer ring: plaintext alphabet. Inner ring: ciphertext alphabet. A shift of 3 maps A to D, B to E, … Z to C.</div>
        </div>

        <h2><span class="num">03</span>The mechanics</h2>
        <p>Number the letters from 0 to 25. Encryption adds the key modulo 26; decryption subtracts it.</p>
        <div class="formula-block">C = (P + k) mod 26<small>P = plaintext index · C = ciphertext index · k = shift</small></div>
        <div class="formula-block">P = (C − k) mod 26<small>the same wheel, turned backwards</small></div>

        <div class="steps">
          <div class="step"><div><h3>Pick a shift</h3><p>Any integer from 0 to 25. A shift of 0 is a very confident way to do nothing.</p></div></div>
          <div class="step"><div><h3>Move each letter</h3><p>Add the shift to the letter's index. Wrap around at the end of the alphabet.</p></div></div>
          <div class="step"><div><h3>Leave everything else alone</h3><p>Spaces, punctuation and digits are not part of the alphabet, so they pass through unchanged.</p></div></div>
        </div>

        <div class="figure">
          <h3 style="margin-top:0">Worked example · k = 3</h3>
          <div class="letter-boxes">
            <span class="box plain">H</span><span class="box plain">E</span><span class="box plain">L</span><span class="box plain">L</span><span class="box plain">O</span>
            <span class="box arrow">→</span>
            <span class="box cipher">K</span><span class="box cipher">H</span><span class="box cipher">O</span><span class="box cipher">O</span><span class="box cipher">R</span>
          </div>
          <table class="example-table">
            <thead><tr><th>plain</th><th>index</th><th>+3</th><th>cipher</th></tr></thead>
            <tbody>
              <tr><td class="mono hl">H</td><td>7</td><td>10</td><td class="mono good">K</td></tr>
              <tr><td class="mono hl">E</td><td>4</td><td>7</td><td class="mono good">H</td></tr>
              <tr><td class="mono hl">L</td><td>11</td><td>14</td><td class="mono good">O</td></tr>
              <tr><td class="mono hl">L</td><td>11</td><td>14</td><td class="mono good">O</td></tr>
              <tr><td class="mono hl">O</td><td>14</td><td>17</td><td class="mono good">R</td></tr>
            </tbody>
          </table>
          <div class="figure-caption">“HELLO” becomes “KHOOR”. To go back, subtract 3 from each ciphertext letter.</div>
        </div>

        <h2><span class="num">04</span>Why it breaks</h2>
        <p>The Caesar cipher keeps the <strong>shape</strong> of the language's letter frequencies. In English, E is the most common letter, followed by T, A, O and I. Shift every letter by the same amount and the whole frequency fingerprint slides sideways — but it does not flatten.</p>

        <div class="figure">
          <div class="freq-chart wide" aria-label="English letter frequency chart">${englishBars}</div>
          <div class="figure-caption"><b>English fingerprint.</b> E, T and A dominate. A Caesar cipher simply relabels these peaks. The tallest bar still gives away the most common plaintext letter.</div>
        </div>

        <p>With a long enough message, an attacker can match the tallest ciphertext peak to E, work out the shift, and read the message. Even without frequency analysis, there are only <strong>26 possible keys</strong>. A computer — or a patient human with a notepad — can try them all.</p>

        <div class="callout good">
          ${icon("bolt")}
          <p><b>Try it yourself.</b> The <a href="#/crack/caesar">Caesar brute force</a> applies all 26 shifts to the first words of a message and scores the results. No key required.</p>
        </div>

        <h2><span class="num">05</span>What it teaches</h2>
        <p>Caesar is not secure by modern standards, but it is a perfect first cipher. It introduces modular arithmetic, substitution, frequency analysis, and the idea of a key space — all in a system small enough to hold in your head.</p>

        <div class="callout">
          ${icon("book")}
          <p>Read more: <a href="https://en.wikipedia.org/wiki/Caesar_cipher" target="_blank" rel="noopener noreferrer">Caesar cipher</a> and <a href="https://en.wikipedia.org/wiki/Frequency_analysis" target="_blank" rel="noopener noreferrer">frequency analysis</a> on Wikipedia.</p>
        </div>

        <div class="next-links">
          <a href="#/caesar">${icon("lock")} Use the cipher</a>
          <a href="#/learn/vigenere">${icon("arrowRight")} Next: Vigenère</a>
          <a href="#/crack/caesar">${icon("bolt")} Crack Caesar</a>
        </div>
      </article>
    `;

    function setup() {
      const wheel = document.getElementById("caesar-wheel");
      const slider = document.getElementById("wheel-shift");
      const readout = document.getElementById("wheel-readout");
      if (!wheel || !slider || !readout) return;

      const NS = "http://www.w3.org/2000/svg";
      const step = 360 / 26;
      const outerRadius = 170;
      const innerRadius = 132;

      wheel.innerHTML = `
        <defs>
          <marker id="wheel-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#966417"></path>
          </marker>
        </defs>
        <circle cx="200" cy="200" r="188" fill="none" stroke="rgba(70,130,180,0.08)" stroke-width="1"></circle>
        <circle cx="200" cy="200" r="184" fill="none" stroke="rgba(70,130,180,0.22)" stroke-width="1" stroke-dasharray="2 6"></circle>
        <circle cx="200" cy="200" r="148" fill="none" stroke="rgba(70,130,180,0.16)" stroke-width="1"></circle>
        <circle cx="200" cy="200" r="112" fill="none" stroke="rgba(44,117,98,0.14)" stroke-width="1"></circle>
        <g id="wheel-ticks"></g>
        <circle id="outer-hl" cx="200" cy="30" r="12" fill="rgba(150,100,23,0.12)" stroke="#966417" stroke-width="1"></circle>
        <circle id="inner-hl" cx="200" cy="68" r="12" fill="rgba(150,100,23,0.12)" stroke="#966417" stroke-width="1"></circle>
        <line id="wheel-link" x1="200" y1="43" x2="200" y2="55" stroke="#966417" stroke-width="1" stroke-dasharray="2 2" marker-end="url(#wheel-arrow)"></line>
        <g id="wheel-outer"></g>
        <g id="wheel-inner"></g>
        <text id="wheel-center-a" x="200" y="194" text-anchor="middle" fill="#1E3D56" font-size="20" font-weight="700">A → D</text>
        <text id="wheel-center-b" x="200" y="216" text-anchor="middle" fill="#456C85" font-size="9">shift k = 3</text>
      `;

      const ticks = wheel.querySelector("#wheel-ticks");
      for (let i = 0; i < 26; i += 1) {
        const angle = ((i * step) - 90) * Math.PI / 180;
        const x1 = 200 + Math.cos(angle) * 182;
        const y1 = 200 + Math.sin(angle) * 182;
        const x2 = 200 + Math.cos(angle) * (i % 5 === 0 ? 188 : 185);
        const y2 = 200 + Math.sin(angle) * (i % 5 === 0 ? 188 : 185);
        const tick = document.createElementNS(NS, "line");
        tick.setAttribute("x1", x1.toFixed(2));
        tick.setAttribute("y1", y1.toFixed(2));
        tick.setAttribute("x2", x2.toFixed(2));
        tick.setAttribute("y2", y2.toFixed(2));
        tick.setAttribute("stroke", i % 5 === 0 ? "rgba(70,130,180,0.45)" : "rgba(70,130,180,0.18)");
        tick.setAttribute("stroke-width", "1");
        ticks.appendChild(tick);
      }

      const outer = wheel.querySelector("#wheel-outer");
      const inner = wheel.querySelector("#wheel-inner");
      const innerTexts = [];

      for (let i = 0; i < 26; i += 1) {
        const angle = ((i * step) - 90) * Math.PI / 180;
        const outerText = document.createElementNS(NS, "text");
        outerText.setAttribute("x", (200 + Math.cos(angle) * outerRadius).toFixed(2));
        outerText.setAttribute("y", (200 + Math.sin(angle) * outerRadius).toFixed(2));
        outerText.setAttribute("text-anchor", "middle");
        outerText.setAttribute("dominant-baseline", "middle");
        outerText.setAttribute("font-size", "11");
        outerText.setAttribute("fill", i === 0 ? "#966417" : "#3A6F99");
        outerText.setAttribute("font-weight", i === 0 ? "700" : "400");
        outerText.textContent = ALPHABET[i];
        outer.appendChild(outerText);

        const innerText = document.createElementNS(NS, "text");
        innerText.setAttribute("text-anchor", "middle");
        innerText.setAttribute("dominant-baseline", "middle");
        innerText.setAttribute("font-size", "11");
        inner.appendChild(innerText);
        innerTexts.push(innerText);
      }

      const centerA = wheel.querySelector("#wheel-center-a");
      const centerB = wheel.querySelector("#wheel-center-b");
      const innerHl = wheel.querySelector("#inner-hl");

      function render(shift) {
        const n = Math.max(0, Math.min(25, Math.trunc(Number(shift) || 0)));
        for (let i = 0; i < 26; i += 1) {
          const letterIndex = (i + n) % 26;
          const angle = ((i * step) - 90) * Math.PI / 180;
          const text = innerTexts[i];
          text.textContent = ALPHABET[letterIndex];
          text.setAttribute("x", (200 + Math.cos(angle) * innerRadius).toFixed(2));
          text.setAttribute("y", (200 + Math.sin(angle) * innerRadius).toFixed(2));
          text.setAttribute("fill", letterIndex === n ? "#966417" : "#2C7562");
          text.setAttribute("font-weight", letterIndex === n ? "700" : "400");
        }
        innerHl.setAttribute("cy", String(200 - innerRadius));
        centerA.textContent = "A → " + ALPHABET[n];
        centerB.textContent = "shift k = " + n;
        readout.innerHTML = "<b>A → " + ALPHABET[n] + "</b> · shift " + n +
          ' · <span class="accent-teal">HELLO → ' + Ciphers.caesar("HELLO", n, "encrypt") + "</span>";
        wheel.setAttribute("aria-label", "Caesar cipher wheel with shift " + n);
        slider.value = String(n);
        UI.setRangeFill(slider);
      }

      slider.addEventListener("input", function () {
        render(slider.value);
      });
      render(3);
    }

    return page(html, setup);
  }

  /* ==========================================================================
     Learn — Vigenère
     ========================================================================== */
  function learnVigenerePage() {
    const html = `
      <div class="breadcrumb">
        <a href="#/">~</a><span class="sep">/</span><a href="#/vigenere">vigenère</a><span class="sep">/</span><span>field notes</span>
      </div>

      <article class="article">
        <div class="article-hero">
          <div>
            <span class="kicker">field notes // 02</span>
            <h1>The Vigenère cipher</h1>
            <p class="lede">One keyword, many shifts. For three centuries it was called “le chiffre indéchiffrable” — the indecipherable cipher.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#/vigenere">${icon("key")} Use the cipher</a>
              <a class="btn btn-ghost" href="#/learn/kasiski">${icon("search")} How it breaks</a>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="big-glyph">KEY</div>
            <div class="art-caption">polyalphabetic · repeating keyword</div>
          </div>
        </div>

        <h2><span class="num">01</span>From one shift to many</h2>
        <p>The Caesar cipher uses the same shift for every letter. The Vigenère cipher uses a <strong>keyword</strong>: the keyword repeats under the plaintext, and each key letter supplies a different shift.</p>
        <p>If the key is <code>LEMON</code>, the shifts are L=11, E=4, M=12, O=14, N=13. The first plaintext letter moves 11 places, the second 4, the third 12, and so on. After five letters, the pattern repeats.</p>

        <div class="figure">
          <span class="kicker">live demo</span>
          <div class="demo-panel">
            <div class="demo-grid">
              <div class="demo-field">
                <label for="demo-plain">plaintext</label>
                <input id="demo-plain" type="text" value="ATTACKATDAWN" spellcheck="false" autocomplete="off">
              </div>
              <div class="demo-field">
                <label for="demo-key">keyword</label>
                <input id="demo-key" type="text" value="LEMON" spellcheck="false" autocomplete="off">
              </div>
            </div>
            <div class="demo-out" id="demo-out"><span class="demo-label">ciphertext</span>LXFOPVEFRNHR</div>
            <div class="alignment" id="demo-alignment" aria-label="Plaintext, key and ciphertext alignment"></div>
            <div class="figure-caption" style="margin-top:10px">Each column shows plaintext / key / ciphertext. Change the message or keyword and watch the shifts move.</div>
          </div>
        </div>

        <h2><span class="num">02</span>The tabula recta</h2>
        <p>The classical way to do this by hand is a <strong>tabula recta</strong>: 26 rows, each a Caesar alphabet shifted one more place. Find the key letter down the side and the plaintext letter across the top; the intersection is the ciphertext letter.</p>

        <div class="figure">
          <div class="tabula-wrap">
            <table class="tabula" id="tabula" aria-label="Vigenère tabula recta"></table>
          </div>
          <div class="tabula-readout" id="tabula-readout">hover a cell — row = key, column = plaintext</div>
          <div class="figure-caption">Row <b class="accent-yellow">L</b> + column <b class="accent-mauve">A</b> = <b class="accent-teal">L</b>. Row <b class="accent-yellow">E</b> + column <b class="accent-mauve">T</b> = <b class="accent-teal">X</b>.</div>
        </div>

        <h2><span class="num">03</span>Worked example</h2>
        <p>Encrypt <code>ATTACKATDAWN</code> with the key <code>LEMON</code>. Repeat the key to match the message length, then add each pair:</p>

        <div class="figure">
          <div class="letter-boxes">
            <span class="box plain">A</span><span class="box plain">T</span><span class="box plain">T</span><span class="box plain">A</span><span class="box plain">C</span><span class="box plain">K</span><span class="box plain">A</span><span class="box plain">T</span><span class="box plain">D</span><span class="box plain">A</span><span class="box plain">W</span><span class="box plain">N</span>
          </div>
          <div class="letter-boxes">
            <span class="box key">L</span><span class="box key">E</span><span class="box key">M</span><span class="box key">O</span><span class="box key">N</span><span class="box key">L</span><span class="box key">E</span><span class="box key">M</span><span class="box key">O</span><span class="box key">N</span><span class="box key">L</span><span class="box key">E</span>
          </div>
          <div class="letter-boxes">
            <span class="box cipher">L</span><span class="box cipher">X</span><span class="box cipher">F</span><span class="box cipher">O</span><span class="box cipher">P</span><span class="box cipher">V</span><span class="box cipher">E</span><span class="box cipher">F</span><span class="box cipher">R</span><span class="box cipher">N</span><span class="box cipher">H</span><span class="box cipher">R</span>
          </div>
          <div class="figure-caption">Plaintext + repeated key = ciphertext. A+L=L, T+E=X, T+M=F, A+O=O, C+N=P, and so on.</div>
        </div>

        <div class="formula-block">C<sub>i</sub> = (P<sub>i</sub> + K<sub>i</sub>) mod 26<small>i is the letter's position; K repeats every key length</small></div>

        <h2><span class="num">04</span>Why it felt unbreakable</h2>
        <p>A Caesar cipher preserves the frequency fingerprint of the language: the E peak stays a peak, just under a different letter. Vigenère smears that fingerprint across several different shifts. In a long message encrypted with a five-letter key, each column has its own Caesar distribution — and the overall histogram looks much flatter.</p>
        <p>For centuries, that was enough to make the cipher famous. It was used by diplomats, generals, and at least one very confident correspondent.</p>

        <h2><span class="num">05</span>Why it isn't</h2>
        <p>The weakness is the word <strong>repeats</strong>. A repeating key means the same plaintext fragment at positions separated by a multiple of the key length produces the same ciphertext fragment. Those repeats can be measured.</p>
        <p>The <a href="#/learn/kasiski">Kasiski examination</a> uses repeated fragments to estimate the key length. Once the length is known, the ciphertext can be split into columns, and each column is just a Caesar cipher. The wall becomes a row of small, breakable doors.</p>

        <div class="callout warn">
          ${icon("info")}
          <p><b>Modern note:</b> Vigenère is a historical and pedagogical cipher, not a secure one. Never use it for real secrets. Use a modern authenticated cipher for anything that matters.</p>
        </div>

        <div class="callout">
          ${icon("book")}
          <p>Read more: <a href="https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher" target="_blank" rel="noopener noreferrer">Vigenère cipher</a>, <a href="https://en.wikipedia.org/wiki/Tabula_recta" target="_blank" rel="noopener noreferrer">tabula recta</a>, and <a href="https://en.wikipedia.org/wiki/Kasiski_examination" target="_blank" rel="noopener noreferrer">Kasiski examination</a> on Wikipedia.</p>
        </div>

        <div class="next-links">
          <a href="#/vigenere">${icon("key")} Use the cipher</a>
          <a href="#/learn/caesar">${icon("arrowLeft")} Back to Caesar</a>
          <a href="#/learn/kasiski">${icon("search")} Next: Kasiski</a>
        </div>
      </article>
    `;

    function setup() {
      const plainInput = document.getElementById("demo-plain");
      const keyInput = document.getElementById("demo-key");
      const out = document.getElementById("demo-out");
      const alignment = document.getElementById("demo-alignment");
      const table = document.getElementById("tabula");
      const readout = document.getElementById("tabula-readout");

      function renderDemo() {
        const plain = plainInput.value.toUpperCase();
        const key = Ciphers.cleanKey(keyInput.value);
        if (!key) {
          out.innerHTML = '<span class="demo-label">ciphertext</span><span class="dim">add a keyword…</span>';
          alignment.innerHTML = "";
          return;
        }
        const cipher = Ciphers.vigenere(plain, key, "encrypt");
        out.innerHTML = '<span class="demo-label">ciphertext</span>' + esc(cipher || "—");
        alignment.innerHTML = "";
        Ciphers.keyAlignment(plain, key, 24).forEach(function (item) {
          const col = document.createElement("div");
          col.className = "align-col";
          const plainBox = document.createElement("span");
          plainBox.className = "a-plain";
          plainBox.textContent = item.plain;
          const keyBox = document.createElement("span");
          keyBox.className = "a-key";
          keyBox.textContent = item.key;
          const cipherBox = document.createElement("span");
          cipherBox.className = "a-cipher";
          cipherBox.textContent = item.cipher;
          col.appendChild(plainBox);
          col.appendChild(keyBox);
          col.appendChild(cipherBox);
          alignment.appendChild(col);
        });
      }

      plainInput.addEventListener("input", renderDemo);
      keyInput.addEventListener("input", renderDemo);
      keyInput.addEventListener("blur", function () {
        keyInput.value = Ciphers.cleanKey(keyInput.value);
        renderDemo();
      });

      if (table) {
        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        const corner = document.createElement("th");
        corner.textContent = "K/P";
        corner.setAttribute("title", "row = key, column = plaintext");
        headRow.appendChild(corner);
        for (let c = 0; c < 26; c += 1) {
          const th = document.createElement("th");
          th.textContent = ALPHABET[c];
          headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        for (let r = 0; r < 26; r += 1) {
          const row = document.createElement("tr");
          const th = document.createElement("th");
          th.textContent = ALPHABET[r];
          row.appendChild(th);
          for (let c = 0; c < 26; c += 1) {
            const td = document.createElement("td");
            td.textContent = ALPHABET[(r + c) % 26];
            td.dataset.row = String(r);
            td.dataset.col = String(c);
            row.appendChild(td);
          }
          tbody.appendChild(row);
        }
        table.appendChild(tbody);

        let previous = null;
        function clearHighlights() {
          if (!previous) return;
          table.querySelectorAll(".is-row, .is-col, .is-cross").forEach(function (cell) {
            cell.classList.remove("is-row", "is-col", "is-cross");
          });
          previous = null;
        }

        function highlight(cell) {
          if (!cell || cell.tagName !== "TD") return;
          clearHighlights();
          const row = Number(cell.dataset.row);
          const col = Number(cell.dataset.col);
          table.querySelectorAll('td[data-row="' + row + '"]').forEach(function (node) {
            node.classList.add("is-row");
          });
          table.querySelectorAll('td[data-col="' + col + '"]').forEach(function (node) {
            node.classList.add("is-col");
          });
          cell.classList.add("is-cross");
          previous = cell;
          readout.innerHTML = "row <b>" + ALPHABET[row] + "</b> + column <b>" + ALPHABET[col] +
            "</b> = <b>" + cell.textContent + "</b>";
        }

        table.addEventListener("mouseover", function (event) {
          highlight(event.target.closest("td"));
        });
        table.addEventListener("click", function (event) {
          highlight(event.target.closest("td"));
        });
        table.addEventListener("mouseleave", clearHighlights);
      }

      renderDemo();
    }

    return page(html, setup);
  }

  /* ==========================================================================
     About
     ========================================================================== */
  function aboutPage() {
    const palette = [
      ["light blue", "#ADD8E6"], ["sky blue", "#87CEEB"], ["powder blue", "#B0E0E6"],
      ["light cyan", "#E0FFFF"], ["steel blue", "#4682B4"], ["ink", "#1E3D56"]
    ].map(function (entry) {
      return '<div class="swatch"><i style="background:' + entry[1] + '"></i><div><b>' + entry[0] + "</b>" + entry[1] + "</div></div>";
    }).join("");

    const html = `
      <div class="breadcrumb">
        <a href="#/">~</a><span class="sep">/</span><span>about</span>
      </div>

      <div class="page-head">
        <div class="page-title-row">
          <div class="page-icon">${icon("flask")}</div>
          <div>
            <h1>About Enigmatica</h1>
            <p class="sub">A portable cipher lab, built for curiosity and good typography.</p>
          </div>
        </div>
      </div>

      <div class="about-grid">
        <section class="panel about-card">
          <div class="profile-row">
            <div class="profile-avatar">${icon("userSecret")}</div>
            <div>
              <h2>Lucas</h2>
              <p>builder of small, strange things · made with vibes</p>
            </div>
          </div>
          <p style="margin-top:18px">Enigmatica is a love letter to classical cryptography: Caesar's shift, Vigenère's repeating key, and the satisfying click of a cipher falling open. Everything runs locally. There is no account, no analytics, and no server to leak your message.</p>

          <h3>Portable by design</h3>
          <ul class="check-list">
            <li>${icon("check")} <span>No build step. Open <code>index.html</code> and go.</span></li>
            <li>${icon("check")} <span>No external requests. Your message never leaves the tab.</span></li>
            <li>${icon("check")} <span>Hash routing, so it works from a local file or any static host.</span></li>
            <li>${icon("check")} <span>EnigmaPath palette, JetBrainsMono Nerd Font, and a fondness for blinking cursors.</span></li>
          </ul>

          <div class="about-meta">
            <span class="pill blue">v1.0.0</span>
            <span class="pill green">local-first</span>
            <span class="pill mauve">no tracking</span>
          </div>
        </section>

        <div style="display:grid;gap:20px">
          <section class="panel about-card">
            <span class="kicker">the palette</span>
            <h3 style="margin-top:8px">EnigmaPath palette</h3>
            <p>Six calm blues and greys shared by every EnigmaPath app.</p>
            <div class="palette-grid">${palette}</div>
          </section>

          <section class="panel about-card">
            <span class="kicker">credits &amp; links</span>
            <div class="credits">
              <a href="https://www.nerdfonts.com/" target="_blank" rel="noopener noreferrer">${icon("link")} Nerd Fonts</a>
              <a href="https://www.jetbrains.com/lp/mono/" target="_blank" rel="noopener noreferrer">${icon("link")} JetBrains Mono</a>
              <a href="https://en.wikipedia.org/wiki/Caesar_cipher" target="_blank" rel="noopener noreferrer">${icon("link")} Caesar cipher · Wikipedia</a>
              <a href="https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher" target="_blank" rel="noopener noreferrer">${icon("link")} Vigenère cipher · Wikipedia</a>
              <a href="https://en.wikipedia.org/wiki/Kasiski_examination" target="_blank" rel="noopener noreferrer">${icon("link")} Kasiski examination · Wikipedia</a>
            </div>
            <div class="about-meta">
              <span class="pill">Lucas M.R 2026</span>
              <span class="pill yellow">with vibes</span>
            </div>
          </section>
        </div>
      </div>

      <section class="panel about-card" style="margin-top:20px">
        <span class="kicker">system</span>
        <div class="formula" style="text-align:left;margin-top:10px;line-height:2">
          <span class="accent-green">$</span> enigmatica --status<br>
          <span class="dim">engine</span> · caesar + vigenère + kasiski(soon)<br>
          <span class="dim">network</span> · <span class="accent-green">0 external requests</span> · all processing local<br>
          <span class="dim">storage</span> · session only · no cookies<br>
          <span class="dim">copyright</span> · Lucas M.R 2026, with vibes
        </div>
      </section>
    `;
    return page(html, null);
  }

  /* ==========================================================================
     Not found
     ========================================================================== */
  function notFoundPage() {
    const html = `
      <div class="page-head">
        <div class="page-title-row">
          <div class="page-icon">${icon("search")}</div>
          <div>
            <h1>404 · cipher not found</h1>
            <p class="sub">This route did not survive decryption. Try one of the known pages.</p>
          </div>
        </div>
      </div>
      <div class="panel panel-pad" style="text-align:center;padding:48px 24px">
        <div class="formula" style="font-size:22px;margin-bottom:18px">?</div>
        <p class="muted">The requested page is not in the codebook.</p>
        <div class="hero-actions" style="justify-content:center">
          <a class="btn btn-primary" href="#/">${icon("arrowLeft")} Back home</a>
          <a class="btn btn-ghost" href="#/caesar">${icon("gears")} Caesar</a>
          <a class="btn btn-ghost" href="#/vigenere">${icon("key")} Vigenère</a>
        </div>
      </div>
    `;
    return page(html, null);
  }

  /* ==========================================================================
     Export
     ========================================================================== */
  global.Pages = {
    home: homePage,
    caesar: function () { return cipherPage("caesar"); },
    vigenere: function () { return cipherPage("vigenere"); },
    crack: crackLandingPage,
    crackCaesar: caesarCrackPage,
    crackVigenere: function () { return kasiskiPage(true); },
    learnCaesar: learnCaesarPage,
    learnVigenere: learnVigenerePage,
    learnKasiski: function () { return kasiskiPage(false); },
    about: aboutPage,
    notFound: notFoundPage
  };
})(window);
