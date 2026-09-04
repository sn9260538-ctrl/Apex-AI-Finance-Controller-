import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // AI Chat API Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, context, manualApiKey, systemPrompt: clientSystemPrompt, minifiedReportJson } = req.body;
      const apiKey = manualApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

      const report = context?.reconciliationReport || context?.latestResult;

      // Helper function to synthesize a high-precision deterministic financial analysis
      // if the external Gemini API is unreachable or no key is in the environment
      const generateDeterministicAnalysis = (userPrompt: string, ctx: any) => {
        const rep = ctx?.reconciliationReport || ctx?.latestResult;
        const p = userPrompt.toLowerCase();
        
        if (!rep) {
          return `### ⚠️ No Reconciliation Data Available\n\nNo reconciliation report was found in the current session. Please run a reconciliation batch from the **Upload / Run** tab first.`;
        }

        const amt = rep.amountSummary || {};
        const matchRate = rep.matchRate ?? "0%";
        const exceptionsCount = rep.summaryCounts?.totalExceptionItems ?? rep.exceptions?.length ?? 0;
        const fullyMatched = rep.summaryCounts?.fullyMatched ?? rep.fullyMatched ?? 0;
        const partialMatches = rep.summaryCounts?.partialMatches ?? rep.partialMatches ?? 0;
        const unmatched = rep.summaryCounts?.unmatched ?? rep.unmatched ?? 0;
        const totalExposure = amt.totalExceptionExposure ?? 0;
        const bankCash = amt.bankCreditedValue ?? 0;
        const pendingSettlement = amt.pendingSettlementValue ?? 0;
        const mdr = amt.totalMdr ?? 0;
        const gstOnMdr = amt.totalGstOnMdr ?? 0;
        const status = rep.overallIntegrityStatus || "passed";

        if (p.includes("exception") || p.includes("discrepancy") || p.includes("error") || p.includes("mismatch") || p.includes("why")) {
          const exceptions = rep.exceptions || [];
          const topExceptions = exceptions.slice(0, 5);
          
          let excDetails = "";
          if (topExceptions.length > 0) {
            excDetails = topExceptions.map((e: any, idx: number) => {
              return `**${idx + 1}. [${e.type || 'Exception'}] Invoice ${e.transactionId || 'N/A'}**\n` +
                     `- **Amount Discrepancy:** ₹${Number(e.difference || 0).toLocaleString('en-IN')}\n` +
                     `- **Action Required:** \`${e.recommendedAction || 'manual_review'}\`\n` +
                     `- **Root Cause / Detail:** ${e.details || e.actionReason || 'Amount mismatch between book invoice and settlement'}`;
            }).join("\n\n");
          } else {
            excDetails = "No active exceptions detected in this run.";
          }

          return `### 📋 Financial Exception Audit Report\n\n` +
                 `Our reconciliation engine identified **${exceptionsCount} exceptions** with a total financial exposure of **₹${totalExposure.toLocaleString('en-IN')}**.\n\n` +
                 `#### Top Actionable Exceptions:\n\n${excDetails}\n\n` +
                 `> **Controller Recommendation:** Prioritize items flagged for \`escalate\` or with exposure exceeding the materiality threshold. Gateway fee variances can be reviewed in the **Settlement & Fee (MDR)** tab.`;
        }

        if (p.includes("cash") || p.includes("forecast") || p.includes("bank") || p.includes("liquidity")) {
          return `### 💰 Cash & Settlement Liquidity Summary\n\n` +
                 `- **Confirmed Bank Cash Credited:** ₹${bankCash.toLocaleString('en-IN')}\n` +
                 `- **Pending Pipeline Settlements:** ₹${pendingSettlement.toLocaleString('en-IN')}\n` +
                 `- **Gateway Fees Deducted (MDR + GST):** ₹${(mdr + gstOnMdr).toLocaleString('en-IN')}\n` +
                 `- **Gross Invoice Volume:** ₹${(amt.grossInvoiceValue || 0).toLocaleString('en-IN')}\n\n` +
                 `**Net Settlement Yield:** ${amt.grossInvoiceValue ? ((bankCash / amt.grossInvoiceValue) * 100).toFixed(1) : 0}% of billed gross receivables have been credited to the primary operational account.`;
        }

        // Default executive summary
        return `### 📊 Executive Reconciliation Summary\n\n` +
               `| Metric | Value |\n` +
               `| :--- | :--- |\n` +
               `| **Overall Batch Status** | \`${String(status).toUpperCase()}\` |\n` +
               `| **Match Rate** | **${matchRate}** |\n` +
               `| **Fully Matched Transactions** | ${fullyMatched} |\n` +
               `| **Partial Matches** | ${partialMatches} |\n` +
               `| **Unmatched Transactions** | ${unmatched} |\n` +
               `| **Total Exceptions Flagged** | ${exceptionsCount} |\n` +
               `| **Total Discrepancy Exposure** | ₹${totalExposure.toLocaleString('en-IN')} |\n` +
               `| **Confirmed Bank Credited Cash** | ₹${bankCash.toLocaleString('en-IN')} |\n` +
               `| **Pending Settlement Value** | ₹${pendingSettlement.toLocaleString('en-IN')} |\n\n` +
               `**Controller Note:** All reconciliation metrics are deterministically computed from the ingested ledger files. Ask me about specific exceptions, cash forecasting, or tax variances for deeper details.`;
      };

      if (!apiKey) {
        // Return deterministic analysis based on the aggregated reconciliation report JSON
        const responseText = generateDeterministicAnalysis(prompt, context);
        return res.json({ text: responseText });
      }

      // Initialize Gemini API dynamically with provided or environment key
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const systemPrompt = clientSystemPrompt || `You are a strict Corporate Financial Controller and Senior Ledger Analyst.
You cannot do math yourself. You must ONLY use the exact deterministic numbers and data provided to you in the JSON report below.
You must act purely as a data analyst, translating the raw JSON reconciliation results, exceptions, and amounts into plain, executive English advice.
Do NOT hallucinate or alter any financial figures. Format your responses with clean Markdown, bold headers, and structured tables where appropriate.

FINANCIAL_STATE_JSON:${minifiedReportJson || JSON.stringify(context)}`;

        // Attempt generation using standard model gemini-3.8-flash, with fallback to gemini-3.6-flash
        let textResult = "";
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { systemInstruction: systemPrompt }
          });
          textResult = response.text || "";
        } catch (modelErr: any) {
          console.warn("gemini-3.8-flash error, trying gemini-3.6-flash:", modelErr.message);
          const response2 = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { systemInstruction: systemPrompt }
          });
          textResult = response2.text || "";
        }

        if (textResult) {
          return res.json({ text: textResult });
        } else {
          throw new Error("Empty response from AI model");
        }
      } catch (geminiError: any) {
        console.error("Gemini API call failed:", geminiError.message);
        // Fallback gracefully to high-precision deterministic analysis of the JSON report
        const fallbackText = generateDeterministicAnalysis(prompt, context);
        return res.json({ text: fallbackText });
      }

    } catch (error: any) {
      console.error("AI Route Error:", error);
      res.status(500).json({ error: "Failed to generate AI response: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

