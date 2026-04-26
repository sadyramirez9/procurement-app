type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Document detail
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Contract review placeholder
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          This page will eventually show extracted terms, classification, and
          review notes for a single contract.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Document summary
          </h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Document ID</dt>
              <dd className="mt-1 font-semibold text-slate-950">{id}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Contract type</dt>
              <dd className="mt-1 text-slate-700">Statement of Work</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Classification</dt>
              <dd className="mt-1 text-slate-700">Pending</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Extracted fields
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Vendor", "Effective date", "Total value", "Payment terms"].map(
              (field) => (
                <div
                  key={field}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-medium text-slate-500">{field}</p>
                  <p className="mt-2 text-sm text-slate-700">Not extracted yet</p>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
