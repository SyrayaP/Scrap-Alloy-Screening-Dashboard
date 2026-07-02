/*
* t2_umap.js — T2 UMAP Overview (KDE family blobs + quadtree brush)
* Owner: P2 · Branch: p2-ui
* See docs/nested_model_L1_L2_L3_L4_report.md §3.4, §4.3
*/

function initT2() {
    pipeline.onChange("loaded", function () {
        document.getElementById("placeholderT2").hidden = true;
        renderT2Overview();
    });
}

function renderT2Overview() {
    // TODO: draw 6 family KDE blob contours (session.blob_contours) on
    // #canvasT2 using Wong hue + CanvasPattern texture fill (§3.2.1, §4.3)
    // TODO: opacity per family blob: isFeasible(family) ? 1.0 : 0.1 (§3.2.3/3.2.4)
    // TODO: rectangle/lasso brush -> quadtree query -> pipeline.set('brush_t2', { rowIds })
    // TODO: hover tooltip: family name, count, median/IQR for YS/CSC/TC/ER
}

document.addEventListener("DOMContentLoaded", initT2);
