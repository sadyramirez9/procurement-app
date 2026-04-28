import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type ExtractFieldsRequestBody = {
  document_id?: string;
};

type DocumentRow = {
  id: string;
  raw_text: string | null;
};

type ExtractedFields = {
  vendor_name: string | null;
  services_description: string | null;
  deliverables: string[] | null;
  pricing_model: string | null;
  contract_value: string | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  locations: string[] | null;
  payment_terms: string | null;
  renewal_terms: string | null;
  termination_terms: string | null;
};

type NormalizedExtractedFields = Omit<ExtractedFields, "contract_value"> & {
  contract_value: number | null;
};

const extractedFieldsSchema = {
  type: "object",
  properties: {
    vendor_name: { anyOf: [{ type: "string" }, { type: "null" }] },
    services_description: { anyOf: [{ type: "string" }, { type: "null" }] },
    deliverables: {
      anyOf: [
        { type: "array", items: { type: "string" } },
        { type: "null" },
      ],
    },
    pricing_model: { anyOf: [{ type: "string" }, { type: "null" }] },
    contract_value: { anyOf: [{ type: "string" }, { type: "null" }] },
    currency: { anyOf: [{ type: "string" }, { type: "null" }] },
    start_date: { anyOf: [{ type: "string" }, { type: "null" }] },
    end_date: { anyOf: [{ type: "string" }, { type: "null" }] },
    locations: {
      anyOf: [
        { type: "array", items: { type: "string" } },
        { type: "null" },
      ],
    },
    payment_terms: { anyOf: [{ type: "string" }, { type: "null" }] },
    renewal_terms: { anyOf: [{ type: "string" }, { type: "null" }] },
    termination_terms: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: [
    "vendor_name",
    "services_description",
    "deliverables",
    "pricing_model",
    "contract_value",
    "currency",
    "start_date",
    "end_date",
    "locations",
    "payment_terms",
    "renewal_terms",
    "termination_terms",
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

function parseCurrency(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return numericValue;
}

function normalizeExtractedFields(
  fields: ExtractedFields,
): NormalizedExtractedFields {
  return {
    ...fields,
    contract_value: parseCurrency(fields.contract_value),
  };
}

async function extractFieldsWithOpenAI(rawText: string) {
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
            "You are an expert procurement analyst. Extract fields carefully from contract text. If a field is unknown or not stated, return null. Do not hallucinate. Return only JSON that matches the schema.",
        },
        {
          role: "user",
          content: `Extract structured procurement fields from this contract text:\n\n${rawText}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "procurement_contract_fields",
          strict: true,
          schema: extractedFieldsSchema,
        },
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error?.message ?? "OpenAI field extraction request failed.",
    );
  }

  const outputText = getOutputText(result);

  if (!outputText) {
    throw new Error("OpenAI returned an empty field extraction response.");
  }

  return JSON.parse(outputText) as ExtractedFields;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ExtractFieldsRequestBody;
  const documentId = body.document_id;

  if (!documentId) {
    return Response.json(
      { success: false, error: "document_id is required." },
      { status: 400 },
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, raw_text")
    .eq("id", documentId)
    .single<DocumentRow>();

  if (documentError || !document) {
    return Response.json(
      {
        success: false,
        error: documentError?.message ?? "Document not found.",
      },
      { status: 404 },
    );
  }

  if (!document.raw_text) {
    return Response.json(
      {
        success: false,
        error: "Document has no raw_text yet. Extract text before fields.",
      },
      { status: 400 },
    );
  }

  let fields: ExtractedFields;

  try {
    fields = await extractFieldsWithOpenAI(document.raw_text);
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not extract structured fields.",
      },
      { status: 500 },
    );
  }

  const normalizedFields = normalizeExtractedFields(fields);

  const { data: savedFields, error: fieldsError } = await supabase
    .from("extracted_fields")
    .insert({
      document_id: document.id,
      ...normalizedFields,
    })
    .select()
    .single();

  if (fieldsError) {
    return Response.json(
      { success: false, error: fieldsError.message },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({ status: "fields_extracted" })
    .eq("id", document.id);

  if (updateError) {
    return Response.json(
      { success: false, error: updateError.message },
      { status: 500 },
    );
  }

  return Response.json({
    success: true,
    fields: savedFields,
  });
}
