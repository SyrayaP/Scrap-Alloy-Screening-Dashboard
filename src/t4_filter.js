/*
* t4_filter.js — T4 Linked Scatter Panel (Filter view)
* Owner: P2 · Branch: p2-ui
* See docs/nested_model_L1_L2_L3_L4_report.md §3.6, §4.5 (Find Top-K,
* click-to-select, rectangle zoom)
*/

const T4_MAX_EXTRA_PLOTS = 3;
const T4_PICK_LIMIT = 4;
let t4ExtraPanelCount = 0;

function initT4() {
    pipeline.onChange("loaded", function () {
        document.getElementById("placeholderT4").hidden = true;
        populateAxisSelect(document.getElementById("t4-2-x"), "TC");
        populateAxisSelect(document.getElementById("t4-2-y"), "YS");
        renderT4Legend();
        renderT4Panels();
        wireT4CanvasClicks();
    });

    pipeline.onChange("active_set", renderT4Panels);
    pipeline.onChange("picks",      renderT4Panels);
    pipeline.onChange("projects",   renderT4Panels);

    document.getElementById("addPlotBtn").addEventListener("click", addScatterPlot);
    document.getElementById("t4-2-x").addEventListener("change", renderT4Panels);
    document.getElementById("t4-2-y").addEventListener("change", renderT4Panels);
}

function renderT4Legend() {
    let html = "";
    for (let i = 0; i < FAMILY_NAMES.length; i++) {
        html += '<span class="legend-item"><span class="legend-swatch" style="background:' +
                FAMILY_COLORS[i] + '"></span>' + FAMILY_NAMES[i] + '</span>';
    }
    document.getElementById("legendT4").innerHTML = html;
}

function renderT4Panels() {
    if (!session.loaded) return;
    drawScatterPanel(document.getElementById("canvasT4-1"), "YS", "CSC");
    const xKey = document.getElementById("t4-2-x").value;
    const yKey = document.getElementById("t4-2-y").value;
    drawScatterPanel(document.getElementById("canvasT4-2"), xKey, yKey);
    drawStackedBar(document.getElementById("canvasT4-bar"));

    for (let n = 1; n <= t4ExtraPanelCount; n++) {
        const canvas = document.getElementById("canvasT4-extra-" + n);
        const xSel = document.getElementById("t4-extra-" + n + "-x");
        const ySel = document.getElementById("t4-extra-" + n + "-y");
        if (canvas && xSel && ySel) drawScatterPanel(canvas, xSel.value, ySel.value);
    }
}

function drawScatterPanel(canvas, xKey, yKey) {
    const hd = setupHiDPICanvas(canvas);
    if (!hd) return;
    const ctx = hd.ctx, W = hd.W, H = hd.H;
    const attrX = ATTR_BY_KEY[xKey], attrY = ATTR_BY_KEY[yKey];
    if (!attrX || !attrY) return;
    const ntX = session.norm_table[attrX.col], ntY = session.norm_table[attrY.col];
    if (!ntX || !ntY) return;

    const mL = 40, mR = 10, mT = 10, mB = 26;
    const plotW = W - mL - mR, plotH = H - mT - mB;

    ctx.clearRect(0, 0, W, H);

    // axes
    ctx.strokeStyle = "#ccc"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mL, mT); ctx.lineTo(mL, mT + plotH); ctx.lineTo(mL + plotW, mT + plotH);
    ctx.stroke();

    ctx.fillStyle = "#333"; ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(attrX.key, mL + plotW / 2, mT + plotH + 18);
    ctx.save();
    ctx.translate(mL - 28, mT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(attrY.key, 0, 0);
    ctx.restore();

    function xToPx(v) { return mL + ((v - ntX.min) / (ntX.max - ntX.min)) * plotW; }
    function yToPx(v) { return mT + plotH - ((v - ntY.min) / (ntY.max - ntY.min)) * plotH; }

    const colX = session.columns[attrX.col], colY = session.columns[attrY.col];
    const labels = session.family_labels;
    const active = session.active_set;
    const n = session.rowCount;

    for (let i = 0; i < n; i++) {
        const alive = !active || active.has(i);
        ctx.globalAlpha = alive ? 0.35 : 0.05;
        ctx.fillStyle = FAMILY_COLORS[labels[i]];
        ctx.fillRect(xToPx(colX[i]), yToPx(colY[i]), 1, 1);
    }
    ctx.globalAlpha = 1;

    // constraint lines
    session.projects.forEach(function (project) {
        const tX = project.thresholds[attrX.key], tY = project.thresholds[attrY.key];
        ctx.strokeStyle = "#222"; ctx.lineWidth = 1.2;
        if (tX && tX.effective != null) {
            const x = xToPx(tX.effective);
            ctx.beginPath(); ctx.moveTo(x, mT); ctx.lineTo(x, mT + plotH); ctx.stroke();
        }
        if (tY && tY.effective != null) {
            const y = yToPx(tY.effective);
            ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(mL + plotW, y); ctx.stroke();
        }
    });

    // numbered pick badges
    session.picks.forEach(function (pick) {
        const px = xToPx(colX[pick.rowId]), py = yToPx(colY[pick.rowId]);
        ctx.fillStyle = "#222";
        ctx.beginPath(); ctx.arc(px, py, 8, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(pick.number, px, py);
    });

    canvas._t4geom = { mL, mT, plotW, plotH, xToPx, yToPx, colX, colY };
}

function drawStackedBar(canvas) {
    const hd = setupHiDPICanvas(canvas);
    if (!hd) return;
    const ctx = hd.ctx, W = hd.W, H = hd.H;
    ctx.clearRect(0, 0, W, H);

    if (session.picks.length === 0) {
        ctx.fillStyle = "#888"; ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Pick alloys in a scatter to see their scrap mix", W / 2, H / 2);
        return;
    }

    const picks = session.picks;
    const barW = 42, gap = 22, mT = 20, mB = 30;
    const totalW = picks.length * barW + (picks.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const barH = H - mT - mB;

    picks.forEach(function (pick, pi) {
        const row = pipeline.getRow(pick.rowId);
        const x = startX + pi * (barW + gap);
        let yCursor = mT;
        SCRAP_FAMILIES.forEach(function (scrap, fi) {
            const pct = row[scrap.col] || 0;
            const h = (pct / 100) * barH;
            ctx.fillStyle = FAMILY_COLORS[fi];
            ctx.fillRect(x, yCursor, barW, h);
            yCursor += h;
        });
        ctx.fillStyle = "#333"; ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("#" + pick.number, x + barW / 2, H - 10);
    });
}

function wireT4CanvasClicks() {
    ["canvasT4-1", "canvasT4-2"].forEach(function (id) {
        const c = document.getElementById(id);
        if (c) c.addEventListener("click", t4OnCanvasClick);
    });
}

function t4OnCanvasClick(evt) {
    const canvas = evt.currentTarget;
    const g = canvas._t4geom;
    if (!g) return;
    const rect = canvas.getBoundingClientRect();
    const px = evt.clientX - rect.left, py = evt.clientY - rect.top;

    let bestIdx = -1, bestDist = 8 * 8;
    const active = session.active_set;
    for (let i = 0; i < session.rowCount; i++) {
        if (active && !active.has(i)) continue;
        const dx = g.xToPx(g.colX[i]) - px, dy = g.yToPx(g.colY[i]) - py;
        const d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx < 0) return;

    const picks = session.picks.slice();
    const existing = picks.findIndex(function (p) { return p.rowId === bestIdx; });
    if (existing >= 0) {
        picks.splice(existing, 1);
        picks.forEach(function (p, i) { p.number = i + 1; });
    } else {
        if (picks.length >= T4_PICK_LIMIT) return;
        picks.push({ rowId: bestIdx, number: picks.length + 1, project: "A" });
    }
    pipeline.set("picks", picks);
}

function addScatterPlot() {
    if (t4ExtraPanelCount >= T4_MAX_EXTRA_PLOTS) return;
    t4ExtraPanelCount += 1;
    const n = t4ExtraPanelCount;

    const panel = document.createElement("div");
    panel.className = "scatter-panel";
    panel.id = "panelT4-extra-" + n;
    panel.innerHTML =
        '<div class="axis-select">' +
        '  <label>X: <select id="t4-extra-' + n + '-x"></select></label>' +
        '  <label>Y: <select id="t4-extra-' + n + '-y"></select></label>' +
        '</div>' +
        '<canvas id="canvasT4-extra-' + n + '" width="360" height="240"></canvas>';

    document.getElementById("t4ExtraPlots").appendChild(panel);
    populateAxisSelect(document.getElementById("t4-extra-" + n + "-x"), "YS");
    populateAxisSelect(document.getElementById("t4-extra-" + n + "-y"), "CSC");
    document.getElementById("t4-extra-" + n + "-x").addEventListener("change", renderT4Panels);
    document.getElementById("t4-extra-" + n + "-y").addEventListener("change", renderT4Panels);
    document.getElementById("canvasT4-extra-" + n).addEventListener("click", t4OnCanvasClick);

    if (t4ExtraPanelCount >= T4_MAX_EXTRA_PLOTS) {
        document.getElementById("addPlotBtn").disabled = true;
    }
    renderT4Panels();
}

function populateAxisSelect(selectEl, defKey) {
    ATTRIBUTES.forEach(function (attr) {
        const opt = document.createElement("option");
        opt.value = attr.key;
        opt.textContent = attr.label;
        if (attr.key === defKey) opt.selected = true;
        selectEl.appendChild(opt);
    });
}

document.addEventListener("DOMContentLoaded", initT4);