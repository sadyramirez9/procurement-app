import Link from "next/link";

const documents = [
  {
    id: "sample-sow",
    name: "Website Redesign SOW",
    vendor: "Northstar Digital",
    status: "Needs review",
    type: "Statement of Work",
  },
  {
    id: "cloud-migration",
    name: "Cloud Migration SOW",
    vendor: "Harbor Systems",
    status: "Draft",
    type: "Statement of Work",
  },
  {
    id: "support-services",
    name: "Support Services Addendum",
    vendor: "Brightline Ops",
    status: "Classified",
    type: "Addendum",
  },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Contract workspace
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Track uploaded SOWs and review placeholder classification progress.
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
          ["Total documents", "3"],
          ["Needs review", "1"],
          ["Ready to classify", "2"],
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

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">Recent documents</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/documents/${document.id}`}
              className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[1.3fr_1fr_0.8fr_0.8fr]"
            >
              <div>
                <p className="font-medium text-slate-950">{document.name}</p>
                <p className="text-sm text-slate-500">{document.type}</p>
              </div>
              <p className="text-sm text-slate-600">{document.vendor}</p>
              <p className="text-sm text-slate-600">{document.status}</p>
              <p className="text-sm font-medium text-emerald-700">
                View details
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
