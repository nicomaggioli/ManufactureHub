import { Router } from "express";
import { AiService } from "../services/AiService";
import { AlibabaSearchService } from "../services/AlibabaSearchService";
import { NotFoundError } from "../utils/errors";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
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
router.post("/draft-message", validate(aiDraftMessageSchema), asyncHandler(async (req, res) => {
  const { type, projectContext, manufacturerData, tone } = req.body;

  const result = await aiService.draftMessage(type, projectContext, manufacturerData, tone);

  res.json({ success: true, data: result });
}));

// POST /api/v1/ai/vet-supplier
router.post("/vet-supplier", validate(aiVetSupplierSchema), asyncHandler(async (req, res) => {
  const { manufacturerData } = req.body;

  const result = await aiService.vetSupplier(manufacturerData);

  res.json({ success: true, data: result });
}));

// POST /api/v1/ai/analyze-design
router.post("/analyze-design", validate(aiAnalyzeDesignSchema), asyncHandler(async (req, res) => {
  const { assetUrls, moodboardData, projectContext } = req.body;

  const result = await aiService.analyzeDesign(assetUrls, moodboardData, projectContext);

  res.json({ success: true, data: result });
}));

// POST /api/v1/ai/extract-spec
router.post("/extract-spec", validate(aiExtractSpecSchema), asyncHandler(async (req, res) => {
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
}));

// POST /api/v1/ai/analyze-quotes
router.post("/analyze-quotes", validate(aiAnalyzeQuotesSchema), asyncHandler(async (req, res) => {
  const { quotes } = req.body;

  const result = await aiService.analyzeQuote(quotes);

  res.json({ success: true, data: result });
}));

// POST /api/v1/ai/generate-followup
router.post("/generate-followup", validate(aiGenerateFollowupSchema), asyncHandler(async (req, res) => {
  const { conversationHistory } = req.body;

  const result = await aiService.generateFollowUp(conversationHistory);

  res.json({ success: true, data: result });
}));

// ─── Alibaba Search (proxied through AI routes) ───

// POST /api/v1/ai/alibaba-search
router.post("/alibaba-search", validate(aiAlibabaSearchSchema), asyncHandler(async (req, res) => {
  const { query, filters, page, pageSize } = req.body;

  const result = await alibabaService.searchSuppliers(query, filters, page, pageSize);

  res.json({ success: true, data: result });
}));

// GET /api/v1/ai/alibaba-supplier/:id
router.get("/alibaba-supplier/:id", asyncHandler(async (req, res) => {
  const supplier = await alibabaService.getSupplierDetails(req.params.id as string);

  if (!supplier) {
    throw new NotFoundError("Supplier not found");
  }

  res.json({ success: true, data: supplier });
}));

export default router;
