/*
* t6_table.js — T6 Alloy Characteristics Table (Lookup view)
* Owner: P2 · Branch: p2-ui
* See docs/nested_model_L1_L2_L3_L4_report.md §3.8, §4.7
*/

function initT6() {
    pipeline.onChange("picks", renderT6Table);
    pipeline.onChange("stock_alerts", renderT6Table);
}

function renderT6Table() {
    document.getElementById("placeholderT6").hidden = session.picks.length > 0;
    // TODO: up to 4 side-by-side columns from session.picks
    // TODO: 3 sections per column: Recipe (6 scrap %), Output properties (17),
    // Chemical composition (12 wt.%), per report §3.8 field list and §4.7
    // number-formatting table (YS 0dp, CSC 3dp, ER/LinearTE scientific 2sf, ...)
    // TODO: red cell background for properties failing the effective threshold;
    // amber cell background for recipe rows implicated in a stock alert (from
    // session.stock_alerts, written by t5_spider.js)
    // TODO: fixed disclaimer row: "Values are CALPHAD predictions. Verify by
    // laboratory measurement before production use."
}

document.addEventListener("DOMContentLoaded", initT6);
