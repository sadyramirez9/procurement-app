"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type DocumentRow = {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
};

type ExtractedFieldsRow = {
  document_id: string;
  vendor_name: string | null;
  contract_value: number | string | null;
};

type ClassificationRow = {
  document_id: string;
  category_level_1: string | null;
  reviewed_by_user: boolean | null;
};

type DashboardDocument = DocumentRow & {
  vendor_name: string | null;
  contract_value: number | string | null;
  category_level_1: string | null;
  reviewed_by_user: boolean;
};

type SortKey = "created_at" | "contract_value";
type StatusFilter = "all" | "uploaded" | "text_extracted" | "classified";
type ReviewFilter = "all" | "reviewed" | "not_reviewed";

function getNumericContractValue(value: number | string | null) {
  if (value === null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));

  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function formatCurrency(value: number | string | null) {
  const numericValue = getNumericContractValue(value);

  if (!numericValue) {
    return "Not found";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(timestamp));
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DashboardDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  useEffect(() => {
    let isActive = true;

    async function loadDocuments() {
      setIsLoading(true);
      setError("");

      const { data: documentRows, error: documentsError } = await supabase
        .from("documents")
        .select("id, file_name, status, created_at")
        .order("created_at", { ascending: false });

      if (documentsError) {
        if (isActive) {
          setError(documentsError.message);
          setIsLoading(false);
        }
        return;
      }

      const documentIds = documentRows?.map((document) => document.id) ?? [];

      if (documentIds.length === 0) {
        if (isActive) {
          setDocuments([]);
          setIsLoading(false);
        }
        return;
      }

      const [
        { data: extractedRows, error: extractedError },
        { data: classificationRows, error: classificationError },
      ] = await Promise.all([
        supabase
          .from("extracted_fields")
          .select("document_id, vendor_name, contract_value")
          .in("document_id", documentIds),
        supabase
          .from("classifications")
          .select("document_id, category_level_1, reviewed_by_user")
          .in("document_id", documentIds),
      ]);

      if (!isActive) {
        return;
      }

      if (extractedError || classificationError) {
        setError(
          extractedError?.message ??
            classificationError?.message ??
            "Could not load dashboard data.",
        );
        setIsLoading(false);
        return;
      }

      const extractedByDocumentId = new Map(
        (extractedRows as ExtractedFieldsRow[] | null)?.map((row) => [
          row.document_id,
          row,
        ]) ?? [],
      );
      const classificationByDocumentId = new Map(
        (classificationRows as ClassificationRow[] | null)?.map((row) => [
          row.document_id,
          row,
        ]) ?? [],
      );

      setDocuments(
        (documentRows as DocumentRow[]).map((document) => {
          const extracted = extractedByDocumentId.get(document.id);
          const classification = classificationByDocumentId.get(document.id);

          return {
            ...document,
            vendor_name: extracted?.vendor_name ?? null,
            contract_value: extracted?.contract_value ?? null,
            category_level_1: classification?.category_level_1 ?? null,
            reviewed_by_user: classification?.reviewed_by_user ?? false,
          };
        }),
      );
      setIsLoading(false);
    }

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents
      .filter((document) =>
        statusFilter === "all" ? true : document.status === statusFilter,
      )
      .filter((document) => {
        if (reviewFilter === "all") {
          return true;
        }

        return reviewFilter === "reviewed"
          ? document.reviewed_by_user
          : !document.reviewed_by_user;
      })
      .sort((firstDocument, secondDocument) => {
        if (sortKey === "contract_value") {
          return (
            getNumericContractValue(secondDocument.contract_value) -
            getNumericContractValue(firstDocument.contract_value)
          );
        }

        return (
          new Date(secondDocument.created_at).getTime() -
          new Date(firstDocument.created_at).getTime()
        );
      });
  }, [documents, reviewFilter, sortKey, statusFilter]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Documents dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Review uploaded contracts, extraction progress, categories, and
            human review status.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          New upload
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Total documents", documents.length],
          [
            "Classified",
            documents.filter((document) => document.status === "classified")
              .length,
          ],
          [
            "Human reviewed",
            documents.filter((document) => document.reviewed_by_user).length,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">All documents</h2>
              <p className="mt-1 text-sm text-slate-500">
                Click a row to open the document detail page.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-medium text-slate-600">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
                >
                  <option value="all">All</option>
                  <option value="uploaded">Uploaded</option>
                  <option value="text_extracted">Text extracted</option>
                  <option value="classified">Classified</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-600">
                Review
                <select
                  value={reviewFilter}
                  onChange={(event) =>
                    setReviewFilter(event.target.value as ReviewFilter)
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
                >
                  <option value="all">All</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="not_reviewed">Not reviewed</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-600">
                Sort by
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
                >
                  <option value="created_at">Created date</option>
                  <option value="contract_value">Contract value</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading documents...
            </p>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="m-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="font-semibold text-slate-950">No documents found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Upload a document or adjust your filters.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">File name</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Contract value</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Reviewed</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredDocuments.map((document) => (
                  <tr
                    key={document.id}
                    onClick={() => router.push(`/documents/${document.id}`)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="max-w-xs px-5 py-4 font-medium text-slate-950">
                      {document.file_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {document.vendor_name ?? "Not found"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {document.category_level_1 ?? "Not classified"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatCurrency(document.contract_value)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                        {formatStatus(document.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          document.reviewed_by_user
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {document.reviewed_by_user ? "Reviewed" : "Not reviewed"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(document.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
