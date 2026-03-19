# Understanding the Wind Forecast Monitoring App Challenge

This document serves as your personal knowledge base for the entire assignment. Read through this before your interview or recording your presentation so you have a crystal-clear understanding of what the task asked for, how it was solved, and the engineering rationale behind every decision.

---

## 1. The Core Challenge

The assignment is split into two distinct parts:
1.  **Software Engineering (The Dashboard):** Build a full-stack web application to visually compare *Actual* UK wind power generation against *Forecasted* generation for a user-specified time range. The crux of the challenge is that forecasts must be dynamically filtered by a **Forecast Horizon** (how many hours in advance the forecast was published).
2.  **Data Analysis (Jupiter Notebook):** Write an open-ended Python analysis to understand the *error characteristics* of the forecasting model across different horizons (4h, 12h, 24h, 48h) and determine how much wind power we can "reliably expect" for the grid.

---

## 2. Breaking Down the Data & The Core Rule

The application relies on two datasets from the **Elexon Insights API (BMRS)**:
*   **FUELHH (Actuals):** What the wind turbines *actually* generated.
    *   `startTime`: The target time the electricity was measured.
    *   `generation`: The amount of power generated (MW).
*   **WINDFOR (Forecasts):** What the meteorological model *predicted* the turbines would generate.
    *   `startTime`: The target time they are predicting for.
    *   `publishTime`: When the prediction was actually published by National Grid ESO.

### The Golden Rule: `publishTime <= targetTime - horizon`
If the user selects a Target Time of `January 2nd at 18:00` and a Horizon of `4 hours`, we need the absolute best prediction that the grid operators had exactly at (or before) `January 2nd at 14:00`.
To do this programmatically, for every point on the chart, we:
1.  Calculate the `cutoffTime` = `targetTime - horizon`.
2.  Find all forecasts pointing to `targetTime`.
3.  Discard any forecast published *after* the `cutoffTime`.
4.  Pick the forecast with the *latest* `publishTime` from the remaining valid options.

---

## 3. What We Built (The Implementation Architecture)

We built a modular, three-part system:

### A. The Backend (Node.js + Express)
**Why it exists:** We cannot safely fetch and cross-reference thousands of JSON objects directly inside the browser without causing memory bloat and UI freezing. Elexon APIs also frequently throw CORS errors to direct browser fetching.
**What it does (`/backend/index.js`):** 
1.  Takes the `start`, `end`, and `horizon` from the frontend.
2.  Fetches Actuals for the exact `[start, end]` window using `settlementDateFrom`.
3.  Fetches Forecasts using a massively buffered window (`start - horizon - 12 hours`) because a 48h horizon forecast for Jan 2nd inherently must have been published on Dec 31st!
4.  Runs the exact $O(N \times M)$ mathematical filtering loop discussed in the Golden Rule above.
5.  Returns a unified, clean JSON array to the frontend.

### B. The Frontend (React + Vite + Chart.js)
**Why it exists:** Vite is the fastest modern React bundler. Chart.js (via `react-chartjs-2`) is the standard for plotting dynamic time-series data because it automatically handles missing data points (gaps) cleanly along the X-axis using `date-fns`.
**What it does (`/frontend/src/App.jsx`):**
1.  Provides strict ISO datetime pickers for the user.
2.  Provides a slider specifically constrained to `{0, 48}` hours.
3.  Maps the unified data from the backend onto a Line chart, plotting Actuals (Blue) and Forecasts (Green Dashed). It handles the "Missing Forecast" requirement natively by dropping null values.

### C. The Analysis Pipeline (Jupyter Notebook)
**Why it exists:** To demonstrate mathematical deduction and first-principles thinking in Python.
**What it does (`/analysis/wind_forecast_analysis.ipynb`):**
1.  **Error Characteristics:** It fetches a massive sample (January 2025) and calculates $Error = Forecast - Actual$. It calculates the Mean Absolute Error (MAE) and P99 Error bounds. It proves mathematically that MAE scales upward rapidly as the horizon increases from 4h to 48h as meteorological models degrade.
2.  **The "Reliability" Recommendation:** You were asked how much MW we can reliably expect. The notebook argues that because the wind generation probability distribution is heavily skewed (wind droughts happen), relying on the *Mean* or *Median* generation would cause grid blackouts. Instead, it extracts the **P5 percentile** (the capacity available 95% of the time) and recommends *that* as the only safe base-load expectation without massive battery backup. 

---

## 4. Nuances and "Gotchas" (Great Interview Talking Points)

If an interviewer asks what obstacles were faced, highlight these two massive API issues you successfully debugged:

1.  **The Stream API Trap:** The original assignment prompt pointed to `/datasets/.../stream`. However, the Elexon Insights Solution's `/stream` endpoints are designed merely to spit out the most recent live data ticks for WebSockets. They completely ignore historical query parameters (like `publishTimeFrom`). Attempting to fetch Jan 2025 on the `/stream` endpoint returned data from March 2026! We had to pivot architecture to query the true historical REST endpoints: `/datasets/FUELHH` and `/datasets/WINDFOR`.
2.  **Elexon Parameter Insanity:** The API uses completely different schema keys for fetching history. Actuals must be queried using `settlementDateFrom`, whereas Forecasts must be queried using `publishDateTimeFrom`. Figuring out the exact OpenAPI schema required deep debugging.
3.  **String vs Timestamp Equality:** UI date strings (`2025-01-01T00:00:00.000Z`) failed to strictly match Elexon API date strings (`2025-01-01T00:00:00Z`). We circumvented this by parsing everything down to raw JavaScript timestamps (`new Date().getTime()`) before applying the `<` or `>` logic bounds.
