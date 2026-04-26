import UploadForm from "./upload-form";

export default function UploadPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Upload
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Add a new SOW contract
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          This placeholder upload flow is ready for the future backend. For now,
          it shows the intended contract intake experience without storing files.
        </p>
      </div>

      <UploadForm />
    </section>
  );
}
