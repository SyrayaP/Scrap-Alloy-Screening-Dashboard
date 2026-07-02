/*
* t4_filter.js — T4 Linked Scatter Panel (Filter view)
* Owner: P2 · Branch: p2-ui
* See docs/nested_model_L1_L2_L3_L4_report.md §3.6, §4.5 (Find Top-K,
* click-to-select, rectangle zoom)
*
* The scatter rendering itself is still TODO. What IS implemented: the
* "+ Add plot" button, which spawns extra custom scatter panels (max 3) into
* the #t4ExtraPlots row beneath the three default plots.
*/

const T4_MAX_EXTRA_PLOTS = 3;
let t4ExtraPanelCount = 0;

function initT4() {
    pipeline.onChange("loaded", function () {
        document.getElementById("placeholderT4").hidden = true;
        // fill the default custom panel's dropdowns (TC vs YS, report §3.6)
        populateAxisSelect(document.getElementById("t4-2-x"), "TC");
        populateAxisSelect(document.getElementById("t4-2-y"), "YS");
        renderT4Panels();
    });

    pipeline.onChange("active_set", renderT4Panels);

    document.getElementById("addPlotBtn").addEventListener("click", addScatterPlot);
}

function renderT4Panels() {
    // TODO: Panel 1 (fixed YS vs CSC) on #canvasT4-1
    // TODO: Panel 2 (custom axes via #t4-2-x / #t4-2-y) on #canvasT4-2
    // TODO: Panel 3 (stacked bar of 6 scrap ratios per selected alloy) on #canvasT4-bar
    // TODO: shared legend in #legendT4 (family hue + texture, §3.2.1)
    // TODO: feasibility zone shading: single-project green / dual-project amber+blue (§3.6)
    // TODO: click-to-select up to 4 alloys -> pipeline.set('picks', [...])
    // each pick must carry a `project: 'A'|'B'` tag (which project's context
    // was active when it was made) — t1_modal.js's re-apply logic relies on
    // this tag to clear only Project B's picks if Project B is removed
    // TODO: rectangle-drag zoom propagates the same row-id subset to all panels;
    // each panel refits its own axes independently. Double-click resets.
}

// spawn one extra custom scatter panel (canvas + X/Y attribute dropdowns) into
// the row below the defaults; capped at T4_MAX_EXTRA_PLOTS
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
        "</div>" +
        '<canvas id="canvasT4-extra-' + n + '" width="360" height="240"></canvas>';

    document.getElementById("t4ExtraPlots").appendChild(panel);
    populateAxisSelect(document.getElementById("t4-extra-" + n + "-x"), "YS");
    populateAxisSelect(document.getElementById("t4-extra-" + n + "-y"), "CSC");

    // hide the button once we've hit the cap
    if (t4ExtraPanelCount >= T4_MAX_EXTRA_PLOTS) {
        document.getElementById("addPlotBtn").disabled = true;
    }
    // TODO: render this new panel via renderT4Panels once scatter drawing exists
}

// fill an attribute dropdown with all 14 attributes; default-select `defKey`
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
