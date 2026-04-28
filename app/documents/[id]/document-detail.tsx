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

export default function DocumentDetail({ documentId }: DocumentDetailProps) {
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  const [extractError, setExtractError] = useState("");
  const [extractSuccess, setExtractSuccess] = useState("");

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

      if (!isActive) {
        return;
      }

      if (fetchError) {
        setDocument(null);
        setError(fetchError.message);
      } else {
        setDocument(data);
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
              <h2 className="text-lg font-semibold text-slate-950">
                Raw Text Preview (coming soon)
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The extracted text is saved to Supabase now, but a preview UI
                will be added in a later step.
              </p>
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
