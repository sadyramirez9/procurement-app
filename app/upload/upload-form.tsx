"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const acceptedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type DraftDocument = {
  fileName: string;
  fileType: "PDF" | "DOCX";
  fileSize: number;
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

function getFileType(file: File): DraftDocument["fileType"] {
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "PDF";
  }

  return "DOCX";
}

function isAcceptedFile(file: File) {
  return (
    acceptedTypes.has(file.type) ||
    file.name.toLowerCase().endsWith(".pdf") ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

function createStoragePath(documentId: string, fileName: string) {
  return `${documentId}/${fileName}`;
}

export default function UploadForm() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [document, setDocument] = useState<DraftDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  function selectFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!isAcceptedFile(file)) {
      setSelectedFile(null);
      setDocument(null);
      setError("Please choose a PDF or DOCX file.");
      return;
    }

    const draftDocument = {
      fileName: file.name,
      fileType: getFileType(file),
      fileSize: file.size,
    };

    setSelectedFile(file);
    setDocument(draftDocument);
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function processDocument() {
    if (!document || !selectedFile) {
      return;
    }

    setIsProcessing(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("documents")
      .insert({
        file_name: document.fileName,
        file_type: document.fileType,
        file_size: document.fileSize,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (insertError || !data?.id) {
      setIsProcessing(false);
      setError(
        insertError?.message ??
          "Something went wrong while saving the document metadata.",
      );
      return;
    }

    const storagePath = createStoragePath(data.id, document.fileName);
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, selectedFile, {
        contentType: selectedFile.type,
        upsert: false,
      });

    if (uploadError) {
      setIsProcessing(false);
      setError(
        `Document metadata was saved, but the file upload failed: ${uploadError.message}`,
      );
      return;
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        storage_path: storagePath,
        status: "file_uploaded",
      })
      .eq("id", data.id);

    if (updateError) {
      setIsProcessing(false);
      setError(
        `The file uploaded, but the document row could not be updated: ${updateError.message}`,
      );
      return;
    }

    router.push(`/documents/${data.id}`);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <label
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={`block cursor-pointer rounded-lg border border-dashed p-10 text-center transition ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="sr-only"
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-white text-2xl text-slate-500 shadow-sm">
          +
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-950">
          Drop your SOW here
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Drag and drop a PDF or DOCX file, or click to browse from your
          computer.
        </p>
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {selectedFile ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-950">Selected file</h3>
          </div>
          <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">File name</dt>
              <dd className="mt-1 break-words text-sm font-semibold text-slate-950">
                {document?.fileName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">File type</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {document?.fileType}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">File size</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {document ? formatFileSize(document.fileSize) : ""}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-700">
                Ready for extraction
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium text-slate-700">
            No file selected
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Choose a PDF or DOCX contract to prepare it for extraction.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!document || isProcessing}
          onClick={processDocument}
          className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
        >
          {isProcessing ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {isProcessing ? "Uploading file..." : "Process Document"}
        </button>
      </div>
    </div>
  );
}
