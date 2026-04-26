"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

const acceptedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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

function getFileType(file: File) {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
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

export default function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function selectFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!isAcceptedFile(file)) {
      setSelectedFile(null);
      setError("Please choose a PDF or DOCX file.");
      return;
    }

    setSelectedFile(file);
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="block cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40"
      >
        <input
          ref={inputRef}
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
                {selectedFile.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">File type</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {getFileType(selectedFile)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">File size</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {formatFileSize(selectedFile.size)}
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
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled
          className="rounded-md bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
        >
          Extract fields - coming soon
        </button>
      </div>
    </div>
  );
}
