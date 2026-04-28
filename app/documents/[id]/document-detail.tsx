"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type DocumentRow = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  storage_path: string | null;
  created_at: string;
};

type ExtractedFieldsRow = {
  id?: string;
  document_id: string;
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

type DocumentDetailProps = {
  documentId: string;
};

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatValue(value: string | null) {
  return value ?? "Not found";
}

function formatList(value: string[] | null) {
  if (!value || value.length === 0) {
    return "Not found";
  }

  return value.join(", ");
}

export default function DocumentDetail({ documentId }: DocumentDetailProps) {
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [extractedFields, setExtractedFields] =
    useState<ExtractedFieldsRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractingFields, setIsExtractingFields] = useState(false);
  const [error, setError] = useState("");
  const [extractError, setExtractError] = useState("");
  const [extractSuccess, setExtractSuccess] = useState("");
  const [fieldsError, setFieldsError] = useState("");
  const [fieldsSuccess, setFieldsSuccess] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadDocument() {
      setIsLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("documents")
        .select(
          "id, file_name, file_type, file_size, status, storage_path, created_at",
        )
        .eq("id", documentId)
        .single();
      const { data: fieldsData, error: fieldsFetchError } = await supabase
        .from("extracted_fields")
        .select(
          "id, document_id, vendor_name, services_description, deliverables, pricing_model, contract_value, currency, start_date, end_date, locations, payment_terms, renewal_terms, termination_terms",
        )
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (fetchError) {
        setDocument(null);
        setError(fetchError.message);
      } else {
        setDocument(data);
      }

      if (fieldsFetchError) {
        setFieldsError(fieldsFetchError.message);
      } else {
        setExtractedFields(fieldsData);
      }

      setIsLoading(false);
    }

    loadDocument();

    return () => {
      isActive = false;
    };
  }, [documentId]);

  async function extractText() {
    setIsExtracting(true);
    setExtractError("");
    setExtractSuccess("");

    const response = await fetch("/api/extract-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ document_id: documentId }),
    });
    const result = (await response.json()) as {
      success: boolean;
      text_length?: number;
      error?: string;
    };

    if (!response.ok || !result.success) {
      setIsExtracting(false);
      setExtractError(result.error ?? "Text extraction failed.");
      return;
    }

    setDocument((currentDocument) =>
      currentDocument
        ? { ...currentDocument, status: "text_extracted" }
        : currentDocument,
    );
    setExtractSuccess(
      `Text extracted successfully (${result.text_length ?? 0} characters).`,
    );
    setIsExtracting(false);
  }

  async function extractFields() {
    setIsExtractingFields(true);
    setFieldsError("");
    setFieldsSuccess("");

    const response = await fetch("/api/extract-fields", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ document_id: documentId }),
    });
    const result = (await response.json()) as {
      success: boolean;
      fields?: ExtractedFieldsRow;
      error?: string;
    };

    if (!response.ok || !result.success || !result.fields) {
      setIsExtractingFields(false);
      setFieldsError(result.error ?? "Field extraction failed.");
      return;
    }

    setExtractedFields(result.fields);
    setDocument((currentDocument) =>
      currentDocument
        ? { ...currentDocument, status: "fields_extracted" }
        : currentDocument,
    );
    setFieldsSuccess("Fields extracted successfully.");
    setIsExtractingFields(false);
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Document detail
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {document?.file_name ?? "Contract review"}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Review saved document metadata now. File upload, extraction, and
          classification will be connected in later steps.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading document...
          </p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-900">
            Could not load document
          </h2>
          <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
        </div>
      ) : null}

      {!isLoading && document ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Document summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Metadata saved in Supabase
                </p>
              </div>
              <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium capitalize text-emerald-700">
                {document.status}
              </span>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-slate-500">File name</dt>
                <dd className="mt-1 break-words font-semibold text-slate-950">
                  {document.file_name}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">File type</dt>
                <dd className="mt-1 text-slate-700">{document.file_type}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">File size</dt>
                <dd className="mt-1 text-slate-700">
                  {formatFileSize(document.file_size)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Status</dt>
                <dd className="mt-1 capitalize text-slate-700">
                  {document.status}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Storage path</dt>
                <dd className="mt-1 break-words text-slate-700">
                  {document.storage_path ?? "Not uploaded yet"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Created at</dt>
                <dd className="mt-1 text-slate-700">
                  {formatDate(document.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
                Temporary debug
              </h2>
              <p className="mt-3 text-sm font-medium text-amber-900">
                Stored storage_path
              </p>
              <p className="mt-2 break-words rounded-md bg-white px-3 py-2 font-mono text-sm text-amber-950">
                {document.storage_path ?? "null"}
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Extracted Fields (coming soon)
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    For now, this step extracts raw PDF text and saves it to the
                    document row. Structured fields will come later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={extractText}
                  disabled={document.file_type !== "PDF" || isExtracting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                >
                  {isExtracting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  {isExtracting ? "Extracting..." : "Extract Text"}
                </button>
              </div>
              {document.file_type !== "PDF" ? (
                <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Text extraction supports PDF files only for now.
                </p>
              ) : null}
              {extractError ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {extractError}
                </p>
              ) : null}
              {extractSuccess ? (
                <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {extractSuccess}
                </p>
              ) : null}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Structured Procurement Fields
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Extract vendor, services, dates, terms, and commercial
                    details from the saved raw text.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={extractFields}
                  disabled={isExtractingFields}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                >
                  {isExtractingFields ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  {isExtractingFields ? "Extracting fields..." : "Extract Fields"}
                </button>
              </div>
              {fieldsError ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {fieldsError}
                </p>
              ) : null}
              {fieldsSuccess ? (
                <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {fieldsSuccess}
                </p>
              ) : null}
              {extractedFields ? (
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Vendor", formatValue(extractedFields.vendor_name)],
                    [
                      "Services",
                      formatValue(extractedFields.services_description),
                    ],
                    ["Deliverables", formatList(extractedFields.deliverables)],
                    ["Pricing model", formatValue(extractedFields.pricing_model)],
                    ["Contract value", formatValue(extractedFields.contract_value)],
                    ["Currency", formatValue(extractedFields.currency)],
                    ["Start date", formatValue(extractedFields.start_date)],
                    ["End date", formatValue(extractedFields.end_date)],
                    ["Locations", formatList(extractedFields.locations)],
                    ["Payment terms", formatValue(extractedFields.payment_terms)],
                    ["Renewal terms", formatValue(extractedFields.renewal_terms)],
                    [
                      "Termination terms",
                      formatValue(extractedFields.termination_terms),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md border border-slate-200 bg-slate-50 p-4"
                    >
                      <dt className="text-sm font-medium text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-2 text-sm leading-6 text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No structured fields extracted yet.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Classification (coming soon)
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Contract type, risk level, and routing recommendations will
                appear here in a future MVP step.
              </p>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
