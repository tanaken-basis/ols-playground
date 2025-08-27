// OLS Playground — React + Vite + Recharts + MathJax

import { useMemo, useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  Line,
} from "recharts";

// -------- i18n --------
const translations = {
  ja: {
    title: "OLS（最小二乗法）探求アプリ",
    lang_label: "Language",
    ja: "日本語",
    en: "English",
    header_desc:
      "真の直線 \\( y = a_0 + b_0 x \\) にノイズを加えたデータ \\((x_1,y_1), \\ldots, (x_n,y_n)\\) に対して、モデル式 \\( y = a + b x \\) のパラメーター \\(a, b\\) を調整して、2乗誤差 \\( \\mathrm{SSE} = \\sum_{i=1}^{n} (y_i - (a + b x_i))^2 \\) を最小化してみましょう。",
    // 見出し
    chart_title: "散布図と直線",
    panel_params: "パラメーター",
    panel_errors: "2乗誤差（SSE）",
    panel_model: "モデル式",
    panel_table: "サンプルデータ",
    panel_settings: "設定",
    panel_true_line: "真の直線",
    // ラベル
    label_points: "データ数",
    label_noise: "ノイズ強度",
    label_intercept: "切片",
    label_slope: "傾き",
    sse_now: "現在の SSE",
    sse_min: "最小 SSE (OLS)",
    mse_now: "現在の MSE",
    mse_min: "最小 MSE (OLS)",
    // カード
    card_current_line: "現在の線",
    card_ols_line: "OLS（最小）",
    // 説明
    color_coding_explanation: "直線の色は、OLSの直線に近いほど緑に、遠いほど赤くなっていきます。",
    about_the_app: "Recharts で散布図と直線を重ねて描画し、MathJax で数式を描画しています。",
    // ボタン
    snap_ols: "OLS にスナップ",
    reset: "リセット",
    // チェックボックス/ラジオ
    show_true_line: "真の直線を表示",
    fixed_axes: "軸範囲を固定",
    show_residuals: "残差（各点から予測線までの縦線）を表示",
    init_mode_label: "初期化モード",
    init_mode_ols: "OLS で 初期化",
    init_mode_zero: "ゼロ で 初期化",
  },
  en: {
    title: "OLS Playground",
    lang_label: "言語",
    ja: "日本語",
    en: "English",
    header_desc:
      "Given noisy samples from the true line \\( y = a_0 + b_0 x \\) over \\((x_1,y_1), \\ldots, (x_n,y_n)\\), adjust the model \\( y = a + b x \\) to minimize the sum of squared errors \\( \\mathrm{SSE} = \\sum_{i=1}^{n} (y_i - (a + b x_i))^2 \\).",
    // Titles
    chart_title: "Scatter & Line",
    panel_params: "Parameters",
    panel_errors: "Squared Errors (SSE)",
    panel_model: "Model",
    panel_table: "Data",
    panel_settings: "Settings",
    panel_true_line: "True line",
    // Labels
    label_points: "points",
    label_noise: "noise",
    label_intercept: "intercept",
    label_slope: "slope",
    sse_now: "Current SSE",
    sse_min: "Minimum SSE (OLS)",
    mse_now: "Current MSE",
    mse_min: "Minimum MSE (OLS)",
    // Cards
    card_current_line: "Current line",
    card_ols_line: "OLS (minimum)",
    // Explanations
    color_coding_explanation: "The color of the line becomes greener the closer it is to the OLS line, and redder the farther it is from the OLS line.",
    about_the_app: "Recharts is used to draw scatter plots and lines, and MathJax is used to draw mathematical formulas.",
    // Buttons
    snap_ols: "Snap to OLS",
    reset: "Reset",
    // Checkboxes / radios
    show_true_line: "Show true line",
    fixed_axes: "Fix axes",
    show_residuals: "Show residuals",
    init_mode_label: "Initialization",
    init_mode_ols: "Init with OLS",
    init_mode_zero: "Init with zero"
  },
};

function useI18n() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ja" || saved === "en") return saved;
    return navigator.language?.startsWith("ja") ? "ja" : "en";
  });
  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);
  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;
  return { lang, setLang, t };
}

function LanguageSwitcher({ lang, setLang }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
      <span style={{ fontWeight: 600 }}>{translations[lang].lang_label}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #475569", background: "#fff", color: "#475569" }}
      >
        <option value="ja">{translations[lang].ja}</option>
        <option value="en">{translations[lang].en}</option>
      </select>
    </label>
  );
}

// -------- MathJax --------
function useMathJax() {
  useEffect(() => {
    if (window.MathJax) return;
    const s = document.createElement("script");
    s.id = "mathjax-script";
    s.async = true;
    s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    document.head.appendChild(s);
  }, []);
}

function MathJaxFormula({ children, inline = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const mj = window.MathJax;
    if (mj && mj.typesetPromise) {
      mj.typesetPromise([ref.current]).catch(() => {});
    }
  }, [children]);
  const Tag = inline ? "span" : "div";
  return <Tag ref={ref}>{children}</Tag>;
}

// -------- ユーティリティ --------
const randBetween = (min, max) => min + Math.random() * (max - min);

function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateDataset({ n = 20, a0, b0, noiseStd = 1.2 }) {
  // a0, b0 が与えられていればそれを使い、未指定(undefined)ならランダム生成（0 も有効値として扱う）
  const _a0 = (a0 !== undefined) ? a0 : randBetween(-5, 5);
  const _b0 = (b0 !== undefined) ? b0 : randBetween(-4, 4);
  const xs = Array.from({ length: n }, () => randBetween(-5, 5)).sort((a, b) => a - b);
  const data = xs.map((x) => ({ x, y: _a0 + _b0 * x + noiseStd * gaussian() }));
  return { a0: _a0, b0: _b0, data };
}

function computeOLS(data) {
  const n = data.length;
  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const xbar = mean(xs);
  const ybar = mean(ys);
  let Sxx = 0, Sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xbar;
    Sxx += dx * dx;
    Sxy += dx * (ys[i] - ybar);
  }
  const bHat = Sxx === 0 ? 0 : Sxy / Sxx;
  const aHat = ybar - bHat * xbar;
  const sseMin = data.reduce((acc, { x, y }) => {
    const r = y - (aHat + bHat * x);
    return acc + r * r;
  }, 0);
  return { aHat, bHat, sseMin };
}

function sseForLine(data, a, b) {
  return data.reduce((acc, { x, y }) => {
    const r = y - (a + b * x);
    return acc + r * r;
  }, 0);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function colorFromSSE(sse, sseMin) {
  // SSE 距離に対する色変化を緩やかに感じられるように非線形マッピング
  // ratio = (SSE - SSEmin)/SSEmin >= 0
  const ratio = Math.max(0, (sse - sseMin) / Math.max(sseMin, 1e-9));
  // arctan マッピング: 0 -> 0, infty -> 1 に単調増加（kで感度調整）
  const k = 0.5; // 大きいほど早く赤くなる, 小さいほどゆっくり
  const t = Math.atan(k * ratio) / (Math.PI / 2); // 0...1
  const hue = 120 * (1 - t); // 120(緑) -> 0(赤)
  return `hsl(${hue}, 80%, 45%)`;
}
function niceNumber(x, digits = 3) { return Number(x.toFixed(digits)); }

export default function App() {
  const { lang, setLang, t } = useI18n();
  useMathJax();

  // --- コントロール状態 ---
  const [n, setN] = useState(20);                 // データ数（5〜200）
  const [noiseStd, setNoiseStd] = useState(1.2);  // ノイズ標準偏差
  const [showResiduals, setShowResiduals] = useState(true); // 残差の縦線を表示
  const [showTrueLine, setShowTrueLine] = useState(false);  // 真の直線を表示
  const [fixedDomain, setFixedDomain] = useState(false);     // グラフ範囲の固定
  const [initModeOLS, setInitModeOLS] = useState(false);    // true: OLS、false: (0,0) 初期化
  
  // --- データ生成と真のパラメータ ---
  const [seed, setSeed] = useState(0); // リセット用シード
  const [a0, setA0] = useState(undefined);
  const [b0, setB0] = useState(undefined);

  const { data } = useMemo(() => {
    // a0,b0 が未確定ならここで新規生成し、確定済みなら固定して再サンプリング
    const gen = generateDataset({ n, a0, b0, noiseStd });
    if (a0 === undefined || b0 === undefined) {
      setA0(gen.a0); setB0(gen.b0);
    }
    return { data: gen.data };
  }, [seed, n, noiseStd, a0, b0]);

  // --- OLS と表示中パラメータ ---
  const { aHat, bHat, sseMin } = useMemo(() => computeOLS(data), [data]);
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  // 生成直後 or リセット時の初期化モード
  useEffect(() => {
    if (initModeOLS) { setA(aHat); setB(bHat); }
    else { setA(0); setB(0); }
  }, [aHat, bHat, seed, initModeOLS]);

  // グラフ範囲
  const xMin = Math.floor(Math.min(-1, Math.min(...data.map((d) => d.x))));
  const xMax = Math.ceil(Math.max(1, Math.max(...data.map((d) => d.x))));
  const yMin = Math.floor(Math.min(-1, Math.min(...data.map((d) => d.y))));
  const yMax = Math.ceil(Math.max(1, Math.max(...data.map((d) => d.y))));
  const padX = 1, padY = 2;

  // SSE と色
  const sse = useMemo(() => sseForLine(data, a, b), [data, a, b]);
  const lineColor = useMemo(() => colorFromSSE(sse, sseMin), [sse, sseMin]);

  // 残差（各点から予測線までの縦線）
  const residualSegments = useMemo(() => {
    return data.map((d) => {
      const yhat = a + b * d.x;
      return [
        { x: d.x, y: d.y },
        { x: d.x, y: yhat },
      ];
    });
  }, [data, a, b]);

  // --- レイアウト改善：左ペインの最小幅を確保し、右は固定幅相当に ---
  const containerStyle = { maxWidth: 1400, margin: "0 auto", padding: 24 };
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(760px, 1fr) 380px",
    gap: 24,
    alignItems: "start",
  };

  const [lx0, lx1] = fixedDomain ? [-6, 6] : [xMin - padX, xMax + padX];
  const lineData = useMemo(() => [ { x: lx0, y: a + b * lx0 }, { x: lx1, y: a + b * lx1 } ], [a, b, lx0, lx1]);
  const trueLineData = useMemo(() => [ { x: lx0, y: a0 + b0 * lx0 }, { x: lx1, y: a0 + b0 * lx1 } ], [a0, b0, lx0, lx1]);

  const mse = sse / data.length;
  const mseMin = sseMin / data.length;

  const handleReset = () => {
    // 新しい真の直線＆サンプルを生成
    setA0(undefined); setB0(undefined); // 新規生成を許可
    setSeed((s) => s + 1);
  };

  return (
    <div style={{ width: 1600, minHeight: "100vh", background: "linear-gradient(#f8fafc, #eef2f7)", color: "#0f172a" }}>
      <div style={containerStyle}>
        <header style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t('title')}</h1>
            <LanguageSwitcher lang={lang} setLang={setLang} />
          </div>
          <div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>
            <MathJaxFormula>{t('header_desc')}</MathJaxFormula>
          </div>
        </header>

        <div style={gridStyle}>
          {/* 左: グラフ */}
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <h2 style={{ fontWeight: 600 }}>{t('chart_title')}</h2>
            </div>
            {/* ResponsiveContainerで高さ固定＆幅100%を明示して */}
            <div style={{ width: "100%", height: 520, minWidth: 720 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" 
                    domain={fixedDomain ? [-6, 6] : [xMin - padX, xMax + padX]}
                    allowDataOverflow={true}
                    label={{ value: "x", position: "insideBottom", offset: -10 }}
                    tickFormatter={(v) => v.toFixed(2)}
                    tick={{ fontSize: 12 }} />
                  <YAxis type="number" dataKey="y"
                    domain={fixedDomain ? [-30, 30] : [yMin - padY, yMax + padY]}
                    allowDataOverflow={true}
                    label={{ value: "y", angle: -90, position: "insideLeft" }}
                    tickFormatter={(v) => v.toFixed(2)}
                    tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />

                  <Scatter name="samples" data={data} fill="#2563eb" opacity={0.9} />

                  {/* 残差の縦線（トグル） */}
                  {showResiduals && residualSegments.map((seg, i) => (
                    <Line
                      key={`residual-${i}`}
                      type="linear"
                      dataKey="y"
                      data={seg}
                      stroke="rgba(35, 170, 220, 0.35)" // 水色・半透明 // "rgba(220, 38, 38, 0.65)" // 赤系・半透明
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}

                  {/* 現在の線 */}
                  <Line type="linear" dataKey="y" data={lineData} stroke={lineColor} strokeWidth={3} dot={false} isAnimationActive={false} />

                  {/* 真の直線（表示トグル） */}
                  {showTrueLine && (
                    <Line type="linear" dataKey="y" data={trueLineData} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} isAnimationActive={false} />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          
            {/* データ表 */}
            <div style={{ marginTop: 48 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>
                {t('panel_table')} <MathJaxFormula inline>{"\\( (x, y) \\)"}</MathJaxFormula>
                </h3>
              <div style={{ maxHeight: 240, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc" }}>
                    <tr>
                      <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>#</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>x</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => (
                      <tr key={`row-${i}`}>
                        <td style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #eef2f7", color: "#0f172a" }}>{i + 1}</td>
                        <td style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #eef2f7", color: "#0f172a" }}>{niceNumber(d.x, 4)}</td>
                        <td style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #eef2f7", color: "#0f172a" }}>{niceNumber(d.y, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 右: コントロール/メトリクス */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* 真の直線 */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", padding: 16, width: 360 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{t('panel_true_line')} <MathJaxFormula inline>{"\\( \\quad y = a_0 + b_0 x \\)"}</MathJaxFormula></h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, fontSize: 14 }}>
                <div style={{ padding: 8, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    &nbsp;<MathJaxFormula inline>{"\\( a_0 = \\, \\)"}</MathJaxFormula>{niceNumber(a0 ?? 0)}<br />
                    &nbsp;<MathJaxFormula inline>{"\\( b_0 = \\, \\)"}</MathJaxFormula>{niceNumber(b0 ?? 0)}
                  </div>
                </div>
              </div>

              {/* リセットのボタン */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button onClick={handleReset} style={{ padding: "8px 12px", borderRadius: 10, background: "#334155", color: "#fff", border: 0, cursor: "pointer" }}>
                  <span>{t('reset') || 'Reset'}</span>（<MathJaxFormula inline>{"\\(a_{0},\\, b_{0}\\)"}</MathJaxFormula>）
                </button>
              </div>
            </div>

            {/* モデル式 */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", padding: 16, width: 360 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{t('panel_model')} <MathJaxFormula inline>{"\\( \\quad y = a + b x \\)"}</MathJaxFormula></h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, fontSize: 14 }}>
                <div style={{ padding: 8, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#64748b" }}>{t('card_current_line')}</div>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    &nbsp;<MathJaxFormula inline>{"\\( a = \\, \\)"}</MathJaxFormula>{niceNumber(a)}<br />
                    &nbsp;<MathJaxFormula inline>{"\\( b = \\, \\)"}</MathJaxFormula>{niceNumber(b)}
                  </div>
                </div>

                <div style={{ padding: 8, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#64748b" }}>{t('card_ols_line')}</div>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    &nbsp;<MathJaxFormula inline>{"\\( \\hat{a} = \\, \\)"}</MathJaxFormula>{niceNumber(aHat)}<br />
                    &nbsp;<MathJaxFormula inline>{"\\( \\hat{b} = \\, \\)"}</MathJaxFormula>{niceNumber(bHat)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                {t('color_coding_explanation')}
              </div>
            
              <h3 style={{ fontWeight: 600, marginBottom: 12 }}>{t('panel_params')}</h3>

              {/* a スライダー */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span>{t('label_intercept')} <MathJaxFormula inline>{"\\( a \\)"}</MathJaxFormula></span>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{niceNumber(a)}</span>
                </div>
                <input type="range" min={-10} max={10} step={0.01} value={a} onChange={(e) => setA(parseFloat(e.target.value))} style={{ width: "100%" }} />
              </div>

              {/* b スライダー */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span>{t('label_slope')} <MathJaxFormula inline>{"\\( b \\)"}</MathJaxFormula></span>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{niceNumber(b)}</span>
                </div>
                <input type="range" min={-5} max={5} step={0.01} value={b} onChange={(e) => setB(parseFloat(e.target.value))} style={{ width: "100%" }} />
              </div>

              {/* スナップのボタン */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button onClick={() => { setA(aHat); setB(bHat); }} style={{ padding: "8px 12px", borderRadius: 10, background: "#059669", color: "#fff", border: 0, cursor: "pointer" }}>
                  {t('snap_ols') || 'Snap to OLS'}
                </button>
              </div>

            </div>

            {/* 2乗誤差の情報 */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", padding: 16, width: 360 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 12 }}>{t('panel_errors')}</h3>
              <Metric label={t('sse_now')} value={sse} />
              <Metric label={t('sse_min')} value={sseMin} /> 
              {/* <Metric label={t('mse_now')} value={mse} />
              <Metric label={t('mse_min')} value={mseMin} /> */}
            </div>

            {/* 表示の設定 */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", padding: 16, width: 360 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 12 }}>{t('panel_settings')}</h3>
              {/* 軸固定 / 真の直線表示 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={showResiduals} onChange={(e) => setShowResiduals(e.target.checked)} />
                  <span>{t('show_residuals')}</span>
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={showTrueLine} onChange={(e) => setShowTrueLine(e.target.checked)} />
                  <span>{t('show_true_line')}</span><MathJaxFormula inline>{"（\\(y=a_0+b_0x\\) ）"}</MathJaxFormula>
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={fixedDomain} onChange={(e) => setFixedDomain(e.target.checked)} />
                  <span>{t('fixed_axes')}</span><MathJaxFormula inline>{"（\\(x:[-6, 6],\\, y:[-30, 30]\\)）"}</MathJaxFormula>
                </label>
              </div>

              {/* ノイズ強度、データ数 */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span>{t('label_noise')} <MathJaxFormula inline>{"\\( \\sigma \\)"}</MathJaxFormula></span>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{niceNumber(noiseStd)}</span>
                </div>
                <input type="range" min={0.01} max={4} step={0.01} value={noiseStd} onChange={(e) => setNoiseStd(parseFloat(e.target.value))} style={{ width: "100%" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, margin: '12px 0 4px' }}>
                  <span>{t('label_points')} <MathJaxFormula inline>{"\\( n \\)"}</MathJaxFormula></span>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{n}</span>
                </div>
                <input type="range" min={5} max={50} step={1} value={n} onChange={(e) => setN(parseInt(e.target.value))} style={{ width: "100%" }} />
              </div>

              {/* 初期化モード */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('init_mode_label')}</div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 16 }}>
                  <input type="radio" name="initmode" checked={initModeOLS} onChange={() => setInitModeOLS(true)} />
                  <span>{t('init_mode_ols')}</span><MathJaxFormula inline>{"（\\(a=\\hat{a}, b=\\hat{b}\\)）"}</MathJaxFormula>
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="radio" name="initmode" checked={!initModeOLS} onChange={() => setInitModeOLS(false)} />
                  <span>{t('init_mode_zero')}</span><MathJaxFormula inline>{"（\\(a=0,\\, b=0\\)）"}</MathJaxFormula>
                </label>
              </div>
            </div>

            
          </div>
        </div>

        <footer style={{ marginTop: 24, fontSize: 12, color: "#64748b" }}>
          <p>{t('about_the_app')}</p>
        </footer>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ fontSize: 14, color: "#64748b" }}>{label}</span>
      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{Number(value.toFixed(4))}</span>
    </div>
  );
}
