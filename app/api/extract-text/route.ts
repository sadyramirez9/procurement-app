import "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type ExtractTextRequestBody = {
  document_id?: string;
};

type DocumentRow = {
  id: string;
  file_type: string;
  storage_path: string | null;
};

function isStorageObjectNotFound(errorMessage: string | undefined) {
  return errorMessage?.toLowerCase().includes("object not found") ?? false;
}

function getStorageNotFoundMessage(storagePath: string) {
  return [
    "Could not find the file in Supabase Storage.",
    `Bucket: documents.`,
    `Object path tried: ${storagePath}.`,
    "The object path should be relative to the bucket, for example {document_id}/{file_name}, not documents/{document_id}/{file_name}.",
  ].join(" ");
}

async function extractPdfText(file: Blob) {
  const fileData = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({
    data: fileData,
    isOffscreenCanvasSupported: false,
    useWorkerFetch: false,
    useSystemFonts: true,
  });

  try {
    const pdfDocument = await loadingTask.promise;
    const pageTexts: string[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");

        pageTexts.push(pageText);
      }

      return pageTexts.join("\n\n").trim();
    } finally {
      await pdfDocument.destroy();
    }
  } finally {
    await loadingTask.destroy();
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as ExtractTextRequestBody;
  const documentId = body.document_id;

  console.log("[extract-text] document_id:", documentId);

  if (!documentId) {
    return Response.json(
      { success: false, error: "document_id is required." },
      { status: 400 },
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, file_type, storage_path")
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

  if (!document.storage_path) {
    console.log("[extract-text] storage_path: missing");

    return Response.json(
      { success: false, error: "Document does not have a storage_path yet." },
      { status: 400 },
    );
  }

  console.log("[extract-text] storage_path:", document.storage_path);

  if (document.file_type !== "PDF") {
    return Response.json(
      { success: false, error: "Only PDF text extraction is supported for now." },
      { status: 400 },
    );
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.storage_path);

  if (downloadError || !file) {
    console.error("[extract-text] storage download failed:", {
      document_id: document.id,
      storage_path: document.storage_path,
      error: downloadError,
    });

    return Response.json(
      {
        success: false,
        error:
          isStorageObjectNotFound(downloadError?.message)
            ? getStorageNotFoundMessage(document.storage_path)
            : (downloadError?.message ?? "Could not download document file."),
      },
      { status: 500 },
    );
  }

  let rawText = "";

  try {
    rawText = await extractPdfText(file);
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? `Could not extract text from PDF: ${error.message}`
            : "Could not extract text from PDF.",
      },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      raw_text: rawText,
      status: "text_extracted",
    })
    .eq("id", document.id);

  if (updateError) {
    return Response.json(
      { success: false, error: updateError.message },
      { status: 500 },
    );
  }

  return Response.json({
    success: true,
    text_length: rawText.length,
  });
}
