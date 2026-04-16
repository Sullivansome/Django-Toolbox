/**
 * Client-side tool UIs (Alpine.js). Labels come from Django json_script#tool-labels.
 */
(function () {
  function L() {
    const el = document.getElementById("tool-labels");
    if (!el) return {};
    try {
      return JSON.parse(el.textContent);
    } catch {
      return {};
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function genUuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  function genUuids(n) {
    const c = Math.min(50, Math.max(1, Math.floor(Number(n)) || 1));
    return Array.from({ length: c }, genUuid);
  }

  async function shaHex(algo, text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest(algo, enc);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("load " + src));
      document.head.appendChild(s);
    });
  }

  const toolUIs = {
    "uuid-generator"(labels) {
      return {
        labels,
        count: 1,
        values: [],
        err: "",
        gen() {
          this.err = "";
          const c = Number(this.count);
          if (!Number.isFinite(c) || c < 1 || c > 50) {
            this.err = labels.error || "Invalid count";
            return;
          }
          this.values = genUuids(c);
        },
        get out() {
          return this.values.join("\n");
        },
        async copy() {
          await copyText(this.out);
        },
      };
    },

    "password-generator"(labels) {
      return {
        labels,
        len: 16,
        useUpper: true,
        useLower: true,
        useNum: true,
        useSym: true,
        out: "",
        charset() {
          let s = "";
          if (this.useLower) s += "abcdefghijklmnopqrstuvwxyz";
          if (this.useUpper) s += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          if (this.useNum) s += "0123456789";
          if (this.useSym) s += "!@#$%^&*()-_=+[]{}";
          return s || "a";
        },
        gen() {
          const cs = this.charset();
          const arr = new Uint8Array(Math.min(128, Math.max(4, this.len | 0)));
          crypto.getRandomValues(arr);
          let pwd = "";
          for (let i = 0; i < arr.length; i++) pwd += cs[arr[i] % cs.length];
          this.out = pwd.slice(0, this.len);
        },
        async copy() {
          await copyText(this.out);
        },
      };
    },

    "lorem-ipsum"(labels) {
      const base =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      return {
        labels,
        count: 3,
        out: "",
        gen() {
          const n = Math.max(1, Math.min(20, this.count | 0));
          this.out = Array.from({ length: n }, () => base).join("\n\n");
        },
        async copy() {
          await copyText(this.out);
        },
      };
    },

    "hash-generator"(labels) {
      return {
        labels,
        input: "",
        md5: "",
        sha256: "",
        sha512: "",
        busy: false,
        err: "",
        async run() {
          this.err = "";
          this.busy = true;
          try {
            this.sha256 = await shaHex("SHA-256", this.input);
            this.sha512 = await shaHex("SHA-512", this.input);
            if (!window.SparkMD5) {
              await loadScript("https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js");
            }
            this.md5 = window.SparkMD5.hash(this.input);
          } catch (e) {
            this.err = String(e);
          }
          this.busy = false;
        },
        async copy(t) {
          await copyText(t);
        },
      };
    },

    "json-formatter"(labels) {
      return {
        labels,
        input: "",
        output: "",
        err: "",
        format() {
          this.err = "";
          try {
            const o = JSON.parse(this.input);
            this.output = JSON.stringify(o, null, 2);
          } catch (e) {
            this.err = String(e);
          }
        },
        async copy() {
          await copyText(this.output);
        },
      };
    },

    "qr-generator"(labels) {
      return {
        labels,
        text: "https://example.com",
        elId: "qr-mount-" + Math.random().toString(36).slice(2),
        loaded: false,
        err: "",
        async ensureLib() {
          if (window.QRCodeStyling) return;
          await loadScript("https://unpkg.com/qr-code-styling@1.6.0/lib/qr-code-styling.js");
        },
        async render() {
          this.err = "";
          await this.ensureLib();
          const mount = document.getElementById(this.elId);
          if (!mount) return;
          mount.innerHTML = "";
          const qr = new window.QRCodeStyling({
            width: 280,
            height: 280,
            data: this.text,
          });
          qr.append(mount);
          this.loaded = true;
        },
      };
    },

    "markdown-preview"(labels) {
      return {
        labels,
        src: "# Hello\n\n**Markdown** preview runs in your browser.",
        html: "",
        async render() {
          if (!window.marked) await loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js");
          this.html = window.marked.parse(this.src);
        },
      };
    },

    "bmi-calculator"(labels) {
      return {
        labels,
        h: 170,
        w: 70,
        bmi: null,
        calc() {
          const hm = this.h / 100;
          this.bmi = hm > 0 ? (this.w / (hm * hm)).toFixed(1) : null;
        },
      };
    },

    "color-converter"(labels) {
      return {
        labels,
        hex: "#3b82f6",
        rgb: "",
        syncFromHex() {
          const m = /^#?([0-9a-f]{6})$/i.exec(this.hex.trim());
          if (!m) {
            this.rgb = "";
            return;
          }
          const n = parseInt(m[1], 16);
          const r = (n >> 16) & 255,
            g = (n >> 8) & 255,
            b = n & 255;
          this.rgb = `rgb(${r}, ${g}, ${b})`;
        },
      };
    },

    "color-contrast-checker"(labels) {
      function parseHex(h) {
        const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
        if (!m) return null;
        const n = parseInt(m[1], 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
      }
      function relLum({ r, g, b }) {
        const srgb = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
      }
      return {
        labels,
        fg: "#000000",
        bg: "#ffffff",
        ratio: null,
        calc() {
          const a = parseHex(this.fg),
            b = parseHex(this.bg);
          if (!a || !b) {
            this.ratio = null;
            return;
          }
          const L1 = relLum(a),
            L2 = relLum(b);
          const light = Math.max(L1, L2),
            dark = Math.min(L1, L2);
          this.ratio = ((light + 0.05) / (dark + 0.05)).toFixed(2);
        },
      };
    },

    "emoji-cleaner"(labels) {
      return {
        labels,
        input: "",
        output: "",
        run() {
          this.output = this.input.replace(/\p{Extended_Pictographic}/gu, "");
        },
        async copy() {
          await copyText(this.output);
        },
      };
    },

    "statistics-summary"(labels) {
      return {
        labels,
        input: "",
        count: 0,
        sum: 0,
        mean: 0,
        min: 0,
        max: 0,
        run() {
          const nums = this.input
            .split(/[\s,;]+/)
            .map((x) => parseFloat(x))
            .filter((x) => !Number.isNaN(x));
          this.count = nums.length;
          if (!nums.length) return;
          this.sum = nums.reduce((a, b) => a + b, 0);
          this.mean = this.sum / nums.length;
          this.min = Math.min(...nums);
          this.max = Math.max(...nums);
        },
      };
    },

    "family-relation-calculator"(labels) {
      return {
        labels,
        note:
          labels.note ||
          "Enter two people’s positions in a family tree (simplified demo). Use the same generation number for siblings.",
        a: 1,
        b: 2,
        result: "",
        calc() {
          this.result =
            this.a === this.b
              ? "Same person"
              : Math.abs(this.a - this.b) === 1
                ? "Adjacent generation — parent/child style link (demo)."
                : "Distant relation (demo heuristic).";
        },
      };
    },

    "finance-number-case-converter"(labels) {
      return {
        labels,
        input: "1234567.89",
        upper: "",
        lower: "",
        run() {
          const n = this.input.trim();
          this.upper = n.toUpperCase();
          this.lower = n.toLowerCase();
        },
      };
    },

    "international-temperature-converter"(labels) {
      return {
        labels,
        c: 0,
        f: 32,
        syncFromC() {
          this.f = (this.c * 9) / 5 + 32;
        },
        syncFromF() {
          this.c = ((this.f - 32) * 5) / 9;
        },
      };
    },

    "cron-explainer"(labels) {
      return {
        labels,
        expr: "0 9 * * 1",
        human: "",
        parse() {
          const p = this.expr.trim().split(/\s+/);
          if (p.length < 5) {
            this.human = "Need 5 fields: min hour dom mon dow";
            return;
          }
          this.human = `At minute ${p[0]}, hour ${p[1]}, day-of-month ${p[2]}, month ${p[3]}, weekday ${p[4]} (crontab-style, simplified).`;
        },
      };
    },

    "date-calculator"(labels) {
      return {
        labels,
        a: "",
        b: "",
        days: null,
        diff() {
          if (!this.a || !this.b) return;
          const d1 = new Date(this.a),
            d2 = new Date(this.b);
          this.days = Math.round((d2 - d1) / 86400000);
        },
      };
    },

    "lunar-new-year-essentials"(labels) {
      return {
        labels,
        years: [
          { y: 2025, d: "Jan 29, 2025" },
          { y: 2026, d: "Feb 17, 2026" },
          { y: 2027, d: "Feb 6, 2027" },
        ],
      };
    },

    "exif-viewer"(labels) {
      return {
        labels,
        info: null,
        err: "",
        async onFile(e) {
          this.err = "";
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          if (!window.exifr) await loadScript("https://unpkg.com/exifr@7.1.3/dist/full.umd.js");
          try {
            this.info = await window.exifr.parse(f);
          } catch (err) {
            this.err = String(err);
          }
        },
      };
    },

    "image-compressor"(labels) {
      return {
        labels,
        quality: 0.8,
        busy: false,
        err: "",
        preview: "",
        async onFile(e) {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          this.busy = true;
          this.err = "";
          try {
            if (!window.imageCompression)
              await loadScript(
                "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js",
              );
            const out = await window.imageCompression(f, { maxSizeMB: 2, useWebWorker: true, initialQuality: this.quality });
            this.preview = URL.createObjectURL(out);
          } catch (err) {
            this.err = String(err);
          }
          this.busy = false;
        },
      };
    },

    "image-converter"(labels) {
      return {
        labels,
        format: "image/png",
        dataUrl: "",
        err: "",
        async onFile(e) {
          this.err = "";
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          const img = new Image();
          const url = URL.createObjectURL(f);
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            c.getContext("2d").drawImage(img, 0, 0);
            this.dataUrl = c.toDataURL(this.format);
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            this.err = "Could not decode image";
            URL.revokeObjectURL(url);
          };
          img.src = url;
        },
        async copy() {
          await copyText(this.dataUrl);
        },
      };
    },

    "image-to-pdf"(labels) {
      return {
        labels,
        busy: false,
        err: "",
        async onFile(e) {
          const files = e.target.files;
          if (!files || !files.length) return;
          this.busy = true;
          this.err = "";
          try {
            if (!window.jspdf) {
              await loadScript(
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js",
              );
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            for (let i = 0; i < files.length; i++) {
              const dataUrl = await fileToDataUrl(files[i]);
              if (i > 0) doc.addPage();
              doc.addImage(dataUrl, "JPEG", 10, 10, 190, 120);
            }
            doc.save("images.pdf");
          } catch (err) {
            this.err = String(err);
          }
          this.busy = false;
        },
      };
    },

    "latex-to-image"(labels) {
      return {
        labels,
        tex: "E = mc^2",
        html: "",
        async render() {
          if (!window.katex) await loadScript("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js");
          if (!document.getElementById("katex-css")) {
            const l = document.createElement("link");
            l.id = "katex-css";
            l.rel = "stylesheet";
            l.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
            document.head.appendChild(l);
          }
          const d = document.createElement("div");
          window.katex.render(this.tex, d, { throwOnError: false, displayMode: true });
          this.html = d.innerHTML;
        },
      };
    },

    "palette-generator"(labels) {
      return {
        labels,
        colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"],
        regen() {
          this.colors = Array.from({ length: 6 }, () => {
            const h = Math.floor(Math.random() * 360);
            return `hsl(${h} 70% 50%)`;
          });
        },
      };
    },

    "random-picker"(labels) {
      return {
        labels,
        lines: "Apple\nBanana\nCherry",
        result: "",
        pick() {
          const items = this.lines
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          if (!items.length) {
            this.result = "";
            return;
          }
          this.result = items[Math.floor(Math.random() * items.length)];
        },
      };
    },

    "social-mockup"(labels) {
      return {
        labels,
        name: "User",
        text: "Hello from the browser-first tool center.",
        handle: "user",
        init() {
          this.$nextTick(() => this.render());
        },
        render() {
          const c = this.$refs.canvas;
          if (!c) return;
          const ctx = c.getContext("2d");
          c.width = 600;
          c.height = 280;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.fillStyle = "#111";
          ctx.font = "bold 18px system-ui";
          ctx.fillText(this.name, 24, 40);
          ctx.fillStyle = "#555";
          ctx.font = "14px system-ui";
          ctx.fillText("@" + this.handle, 24, 62);
          ctx.fillStyle = "#111";
          ctx.font = "16px system-ui";
          const words = this.text.split(" ");
          let line = "",
            y = 100;
          for (const w of words) {
            const test = line + w + " ";
            if (ctx.measureText(test).width > 540 && line) {
              ctx.fillText(line, 24, y);
              line = w + " ";
              y += 22;
            } else line = test;
          }
          ctx.fillText(line, 24, y);
        },
      };
    },

    "svg-recolor"(labels) {
      return {
        labels,
        svg: "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='red' width='100' height='100'/></svg>",
        from: "#ff0000",
        to: "#3b82f6",
        out: "",
        run() {
          this.out = this.svg.replaceAll(this.from, this.to);
        },
        async copy() {
          await copyText(this.out);
        },
      };
    },

    "timezone-meeting-planner"(labels) {
      return {
        labels,
        zones: ["America/New_York", "Europe/London", "Asia/Shanghai"],
        hour: 14,
        async ensureLuxon() {
          if (window.luxon) return;
          await loadScript("https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js");
        },
        async calc() {
          await this.ensureLuxon();
          const DateTime = window.luxon && window.luxon.DateTime;
          const rows = this.zones.map((z) => {
            const dt = DateTime.fromObject({ hour: this.hour }, { zone: z });
            return { zone: z, time: dt.toFormat("HH:mm ZZZZ") };
          });
          this.rows = rows;
        },
        rows: [],
      };
    },

    "unit-converter"(labels) {
      return {
        labels,
        meters: 1,
        feet: 3.28084,
        syncM() {
          this.feet = this.meters * 3.28084;
        },
        syncF() {
          this.meters = this.feet / 3.28084;
        },
      };
    },

    "video-to-gif"(labels) {
      return {
        labels,
        status:
          labels.pickFile ||
          "Select a short video (first ~5s). FFmpeg.wasm downloads on first use (large).",
        busy: false,
        err: "",
        async onFile(e) {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          this.busy = true;
          this.err = "";
          this.status = "Loading ffmpeg.wasm…";
          try {
            const { FFmpeg } = await import(
              "https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js",
            );
            const { fetchFile } = await import(
              "https://unpkg.com/@ffmpeg/util@0.12.2/dist/esm/index.js",
            );
            const ffmpeg = new FFmpeg();
            await ffmpeg.load();
            await ffmpeg.writeFile("input.mp4", await fetchFile(f));
            await ffmpeg.exec(["-i", "input.mp4", "-t", "5", "out.gif"]);
            const data = await ffmpeg.readFile("out.gif");
            const buf = data.buffer ? data.buffer : data;
            const blob = new Blob([buf], { type: "image/gif" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "clip.gif";
            a.click();
            URL.revokeObjectURL(url);
            this.status = "Done.";
          } catch (err) {
            this.err =
              String(err) +
              " — If the module fails to load, ensure your browser allows ES modules from unpkg.";
            this.status = "Error";
          }
          this.busy = false;
        },
      };
    },

    ocr(labels) {
      return {
        labels,
        busy: false,
        text: "",
        err: "",
        async onFile(e) {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          this.busy = true;
          this.err = "";
          try {
            if (!window.Tesseract) await loadScript("https://unpkg.com/tesseract.js@5/dist/tesseract.min.js");
            const r = await window.Tesseract.recognize(f, "eng");
            this.text = r.data.text;
          } catch (err) {
            this.err = String(err);
          }
          this.busy = false;
        },
        async copy() {
          await copyText(this.text);
        },
      };
    },
  };

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  window.toolUIs = toolUIs;
  window.toolFactory = function (slug) {
    const labels = L();
    const fn = toolUIs[slug];
    if (!fn) {
      return { labels, error: "Unknown tool: " + slug };
    }
    return fn(labels);
  };
})();
