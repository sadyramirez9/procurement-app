"use client";

import { useMemo, useSyncExternalStore } from "react";

type TemporaryDocument = {
  id: string;
  fileName: string;
  fileType: "PDF" | "DOCX";
  fileSize: number;
  uploadTimestamp: string;
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

function formatUploadTime(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function DocumentDetail({ documentId }: DocumentDetailProps) {
  const storedDocument = useSyncExternalStore(
    () => () => {},
    () => window.sessionStorage.getItem(`procureiq-document-${documentId}`),
    () => null,
  );
  const document = useMemo<TemporaryDocument | null>(() => {
    if (!storedDocument) {
      return null;
    }

    return JSON.parse(storedDocument);
  }, [storedDocument]);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Document detail
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {document?.fileName ?? "Contract review"}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Review the uploaded document details now. Extraction and
          classification will be connected in a later step.
        </p>
      </div>

      {document ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Document summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Temporary frontend upload record
                </p>
              </div>
              <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Ready
              </span>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-slate-500">File name</dt>
                <dd className="mt-1 break-words font-semibold text-slate-950">
                  {document.fileName}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">File type</dt>
                <dd className="mt-1 text-slate-700">{document.fileType}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">File size</dt>
                <dd className="mt-1 text-slate-700">
                  {formatFileSize(document.fileSize)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Upload timestamp</dt>
                <dd className="mt-1 text-slate-700">
                  {formatUploadTime(document.uploadTimestamp)}
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
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            No temporary document found
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Upload and process a PDF or DOCX file first to populate this
            frontend-only detail page.
          </p>
        </div>
      )}
    </>
  );
}
