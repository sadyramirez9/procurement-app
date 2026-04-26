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

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-2xl text-slate-500">
          +
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-950">
          Drop your SOW here
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          PDF, DOC, or DOCX support will be connected later. This screen is
          frontend-only for the first MVP step.
        </p>
        <button
          type="button"
          className="mt-6 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Choose file
        </button>
      </div>
    </section>
  );
}
