import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type ClassifyDocumentRequestBody = {
  document_id?: string;
};

type DocumentRow = {
  id: string;
  file_name: string;
};

type ExtractedFieldsRow = {
  document_id: string;
  vendor_name: string | null;
  services_description: string | null;
  deliverables: string[] | null;
  pricing_model: string | null;
};

type Classification = {
  category_level_1: string;
  category_level_2: string;
  category_level_3: string | null;
  confidence_score: number;
  rationale: string;
  alternative_categories: string[];
  needs_human_review: boolean;
};

const taxonomy = `
Marketing
- Creative Agency
- Media Buying
- SEO
- Content Production
- Influencer Marketing
- Events
- Market Research

IT Services
- Software Development
- Managed Services
- Cloud Services
- Cybersecurity

Professional Services
- Strategy Consulting
- Operations Consulting
- Finance Consulting
- Legal Services

HR Services
- Recruiting
- Training
- Benefits Administration

Facilities
- Maintenance
- Security
- Cleaning

Finance
- Accounting
- Audit
- Tax

Operations
- Logistics
- Customer Support
- Back Office Support
`;

const classificationSchema = {
  type: "object",
  properties: {
    category_level_1: { type: "string" },
    category_level_2: { type: "string" },
    category_level_3: { anyOf: [{ type: "string" }, { type: "null" }] },
    confidence_score: { type: "number" },
    rationale: { type: "string" },
    alternative_categories: {
      type: "array",
      items: { type: "string" },
    },
    needs_human_review: { type: "boolean" },
  },
  required: [
    "category_level_1",
    "category_level_2",
    "category_level_3",
    "confidence_score",
    "rationale",
    "alternative_categories",
    "needs_human_review",
  ],
  additionalProperties: false,
};

function getOutputText(response: {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}) {
  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")?.text ?? ""
  );
}

function normalizeClassification(classification: Classification) {
  const parsedConfidenceScore = Number(classification.confidence_score);
  const confidenceScore = Number.isNaN(parsedConfidenceScore)
    ? 0
    : Math.min(Math.max(parsedConfidenceScore, 0), 1);

  return {
    ...classification,
    confidence_score: confidenceScore,
    needs_human_review:
      confidenceScore < 0.75 || classification.needs_human_review,
  };
}

async function classifyWithOpenAI(fields: ExtractedFieldsRow) {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are an expert procurement analyst. Classify the document using only the supplied taxonomy. Base classification primarily on services_description, deliverables, vendor_name, and pricing_model. If confidence_score is below 0.75, needs_human_review must be true. If multiple categories are plausible, include alternatives. Do not hallucinate. Return only JSON that matches the schema.",
        },
        {
          role: "user",
          content: `Taxonomy:\n${taxonomy}\n\nExtracted fields:\n${JSON.stringify(
            fields,
            null,
            2,
          )}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "procurement_classification",
          strict: true,
          schema: classificationSchema,
        },
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error?.message ?? "OpenAI classification request failed.",
    );
  }

  const outputText = getOutputText(result);

  if (!outputText) {
    throw new Error("OpenAI returned an empty classification response.");
  }

  return normalizeClassification(JSON.parse(outputText) as Classification);
}

export async function POST(request: Request) {
  const body = (await request.json()) as ClassifyDocumentRequestBody;
  const documentId = body.document_id;

  if (!documentId) {
    return Response.json(
      { error: "document_id is required." },
      { status: 400 },
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, file_name")
    .eq("id", documentId)
    .single<DocumentRow>();

  if (documentError || !document) {
    return Response.json(
      { error: documentError?.message ?? "Document not found." },
      { status: 404 },
    );
  }

  const { data: extractedFields, error: extractedFieldsError } = await supabase
    .from("extracted_fields")
    .select(
      "document_id, vendor_name, services_description, deliverables, pricing_model",
    )
    .eq("document_id", document.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single<ExtractedFieldsRow>();

  if (extractedFieldsError || !extractedFields) {
    return Response.json(
      {
        error:
          extractedFieldsError?.message ??
          "Extracted fields not found. Extract fields before classifying.",
      },
      { status: 400 },
    );
  }

  let classification: Classification;

  try {
    classification = await classifyWithOpenAI(extractedFields);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not classify document.",
      },
      { status: 500 },
    );
  }

  const { error: classificationError } = await supabase
    .from("classifications")
    .insert({
      document_id: document.id,
      ...classification,
    });

  if (classificationError) {
    return Response.json(
      { error: classificationError.message },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({ status: "classified" })
    .eq("id", document.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json(classification);
}
