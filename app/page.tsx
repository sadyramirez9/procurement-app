import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
      <div className="flex flex-col justify-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Procurement Contract Intelligence
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Turn SOW contracts into clear, review-ready summaries.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Upload statements of work, review extracted contract fields, and
          classify documents from a simple workspace. This MVP starts with the
          core screens before adding extraction and AI.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Upload a contract
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-medium text-slate-500">MVP workflow</p>
            <h2 className="text-xl font-semibold text-slate-950">
              Contract intake
            </h2>
          </div>
          <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Step 1
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {["Upload SOW", "Extract key fields", "Classify contract"].map(
            (step, index) => (
              <div
                key={step}
                className="flex items-center gap-4 rounded-md border border-slate-200 p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-950">{step}</p>
                  <p className="text-sm text-slate-500">
                    {index === 0
                      ? "Available now as a frontend screen."
                      : "Coming in a later MVP step."}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
