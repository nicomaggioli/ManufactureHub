import { Router, Request, Response } from "express";
import { AiService } from "../services/AiService";
import { AlibabaSearchService } from "../services/AlibabaSearchService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  aiDraftMessageSchema,
  aiVetSupplierSchema,
  aiAnalyzeDesignSchema,
  aiExtractSpecSchema,
  aiAnalyzeQuotesSchema,
  aiGenerateFollowupSchema,
  aiAlibabaSearchSchema,
} from "../schemas";

const router = Router();
const aiService = new AiService();
const alibabaService = new AlibabaSearchService();

router.use(requireAuth);

// POST /api/v1/ai/draft-message
router.post("/draft-message", validate(aiDraftMessageSchema), async (req: Request, res: Response) => {
  try {
    const { type, projectContext, manufacturerData, tone } = req.body;

    const result = await aiService.draftMessage(type, projectContext, manufacturerData, tone);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "AI_ERROR", message: err.message } });
  }
});

// POST /api/v1/ai/vet-supplier
router.post("/vet-supplier", validate(aiVetSupplierSchema), async (req: Request, res: Response) => {
  try {
    const { manufacturerData } = req.body;

    const result = await aiService.vetSupplier(manufacturerData);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "AI_ERROR", message: err.message } });
  }
});

// POST /api/v1/ai/analyze-design
router.post("/analyze-design", validate(aiAnalyzeDesignSchema), async (req: Request, res: Response) => {
  try {
    const { assetUrls, moodboardData, projectContext } = req.body;

    const result = await aiService.analyzeDesign(assetUrls, moodboardData, projectContext);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "AI_ERROR", message: err.message } });
  }
});

// POST /api/v1/ai/extract-spec
router.post("/extract-spec", validate(aiExtractSpecSchema), async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    const result = await aiService.extractSpecData(description);

    // Try to parse the JSON result for the caller
    let parsed: unknown = result.result;
    try {
      parsed = JSON.parse(result.result);
    } catch {
      // Keep raw text if not valid JSON
    }

    res.json({
      success: true,
      data: {
        ...result,
        result: parsed,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "AI_ERROR", message: err.message } });
  }
});

// POST /api/v1/ai/analyze-quotes
router.post("/analyze-quotes", validate(aiAnalyzeQuotesSchema), async (req: Request, res: Response) => {
  try {
    const { quotes } = req.body;

    const result = await aiService.analyzeQuote(quotes);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "AI_ERROR", message: err.message } });
  }
});

// POST /api/v1/ai/generate-followup
router.post("/generate-followup", validate(aiGenerateFollowupSchema), async (req: Request, res: Response) => {
  try {
    const { conversationHistory } = req.body;

    const result = await aiService.generateFollowUp(conversationHistory);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "AI_ERROR", message: err.message } });
  }
});

// ─── Alibaba Search (proxied through AI routes) ───

// POST /api/v1/ai/alibaba-search
router.post("/alibaba-search", validate(aiAlibabaSearchSchema), async (req: Request, res: Response) => {
  try {
    const { query, filters, page, pageSize } = req.body;

    const result = await alibabaService.searchSuppliers(query, filters, page, pageSize);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/ai/alibaba-supplier/:id
router.get("/alibaba-supplier/:id", async (req: Request, res: Response) => {
  try {
    const supplier = await alibabaService.getSupplierDetails(req.params.id as string);

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Supplier not found" },
      });
      return;
    }

    res.json({ success: true, data: supplier });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

export default router;
