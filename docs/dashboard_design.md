# Apex Finance Controller: Executive Dashboard Architecture

*Designed by a Senior Financial Analyst & Treasury Head*

As a finance leader managing institutional cash flows, I don't want to dig through tables to find out if we're bleeding cash or if a gateway is holding our money. I need to open my laptop at 8:00 AM and know instantly: **Are we solvent? Are we in control? Where is the risk?**

Here is the blueprint for the perfect CFO and Treasury dashboard for the Apex platform.

---

## 1. Executive Summary (The "8:00 AM" View)
*The first 5 seconds of screen time. No scrolling required.*

**Format:** 5 High-contrast KPI Cards across the top.
*   **Total Cash Position:**
    *   *Metric:* ₹ Current Settled Balance + ₹ In-Transit (T+1/T+2 expected).
    *   *Format:* Large bold number. Green if > Target Buffer.
    *   *Context:* `vs. Yesterday (▲/▼ %)` and a sparkline of the last 7 days.
*   **Reconciliation Match Rate:**
    *   *Metric:* % of Txns matched perfectly across all 4 hops.
    *   *Format:* Circular Gauge.
    *   *Thresholds:* Green (95%+), Yellow (85-94%), Red (<85%). *(Currently red at 83%)*.
*   **Exception Exposure (Value at Risk):**
    *   *Metric:* Total ₹ value of *all* open exceptions.
    *   *Format:* Bold Red number. This tells the CFO exactly how much money is currently "missing" or disputed.
    *   *Context:* Breakdown subtext: `(₹X Missing Settlement, ₹Y Amount Mismatch)`.
*   **MDR Leakage / Fee Variance:**
    *   *Metric:* Actual Fees Deducted vs. Expected 2% Contractual MDR.
    *   *Format:* Currency number. Red if Actual > Expected.
    *   *Context:* Alerts the CFO instantly if a gateway silently changes tiers or charges GST on fees incorrectly.
*   **Working Capital Cycle (DSO):**
    *   *Metric:* Average Days Sales Outstanding (Invoice → Bank Credit).
    *   *Format:* Number (e.g., `1.8 Days`).
    *   *Context:* Crucial for treasury liquidity planning.

---

## 2. Cash Position & Treasury Forecasting
*Answers: "Can we make payroll next week?"*

*   **Primary Chart: 7-Day Rolling Cash Flow Forecast (Area Chart)**
    *   *X-Axis:* Dates (Today - 3 days → Today + 7 days).
    *   *Y-Axis:* ₹ Balance.
    *   *Series 1 (Solid Blue Area):* Settled/Confirmed Cash in Bank.
    *   *Series 2 (Striped Blue/Grey Area stacked on top):* "In-Transit" cash (payments processed, awaiting T+N settlement).
    *   *Annotation:* A horizontal dashed Red Line representing the "Minimum Operating Buffer" (e.g., ₹50,000).
*   **Secondary Chart: Daily Inflow vs. Outflow (Overlaid Bar & Line)**
    *   *Bars:* Green bars (Inflows from Settlements) pointing up, Red bars (Refunds/Chargebacks/Fees) pointing down from a zero baseline.
    *   *Line:* Cumulative net change for the day.

---

## 3. Reconciliation Health & Exceptions
*Answers: "Is the operational engine breaking down?"*

*   **Primary Chart: The Reconciliation Funnel (Funnel Chart)**
    *   *Stages:* 1. Invoices (100%) → 2. Payments (97%) → 3. Settlements (95%) → 4. Bank Credits (83%).
    *   *Insight:* Shows exactly where the leakage occurs. A massive drop at stage 4 screams "Gateway Batching Issue".
*   **Secondary Chart: Exception Heatmap (Grid/Matrix)**
    *   *Rows:* Merchant IDs or Payment Gateways.
    *   *Columns:* Exception Types (Missing Settlement, Mismatch, Timing, etc.).
    *   *Color:* Deep red for high volume/value. Instantly highlights if `MERCHANT_004` is suddenly dropping all UPI payments.
*   **Actionable Widget: Aging Exceptions (Stacked Bar)**
    *   *X-Axis:* Buckets (0-24hr, 1-3 Days, >3 Days).
    *   *Y-Axis:* ₹ Value.
    *   *Action:* Clicking the ">3 Days" red bar filters the data grid below to allow instant escalation.

---

## 4. Settlement Operations (Gross-to-Net)
*Answers: "Are we being overcharged on fees?"*

*   **Primary Chart: The Gross-to-Net Bridge (Waterfall Chart)**
    *   *Flow:* Total Gross Invoices (Start) 
        → (-) Missing Payments 
        → (-) Expected MDR (2%) 
        → (-) Unexplained Fee Variance (The Leakage) 
        → (-) Refunds 
        → Net Bank Credit (End).
    *   *Why:* Finance teams live in Waterfall charts. It visually bridges top-line sales to bottom-line cash.
*   **Secondary Chart: Settlement Timing (T+N) Histogram**
    *   *X-Axis:* T+0, T+1, T+2, T+3+.
    *   *Y-Axis:* Volume of transactions.
    *   *Insight:* Are we actually getting T+1 as contracted? Or is the gateway silently holding funds for T+3?

---

## 5. Razorpay Buildathon Edge (Gateway Optimization)
*Specific metrics that prove this tool optimizes merchant profitability.*

*   **Widget: Gateway Performance Matrix (Scatter Plot)**
    *   *X-Axis:* Effective MDR % (Cost).
    *   *Y-Axis:* Settlement Speed / Success Rate (Reliability).
    *   *Insight:* Visually plots Payment Methods (UPI, Cards, NetBanking). High success + Low cost = Top Right Quadrant. 
    *   *Action:* Generates an AI insight: *"Shifting 15% of Card volume to UPI could save ₹14,000/month."*
*   **Widget: The "Orphaned Batch" AI Resolver**
    *   *UI:* A dedicated pane showing the LLM (Gemini) un-tangling a massive grouped settlement.
    *   *Display:* "Bank Credit ₹48,000 matches 14 orphaned payments with 98% confidence." → [1-Click Approve].

---

## Implementation Notes for the UI/UX
*   **Color Palette:** Use institutional, accessible colors. Deep Navy/Slate for primary structure, muted Greens/Reds for status, minimal bright colors to reduce fatigue.
*   **Interactivity:** Every chart must act as a filter. Clicking a slice of a donut chart must filter the underlying data grid of 500 transactions.
*   **Export:** Finance runs on Excel. Every widget must have a subtle "Export CSV" icon.
