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
  const [error, setError] = useState("");

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
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Extracted Fields (coming soon)
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Key contract fields like vendor, dates, payment terms, and total
                value will appear here after extraction is added.
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
