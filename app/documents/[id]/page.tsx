import DocumentDetail from "./document-detail";

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
      <DocumentDetail documentId={id} />
    </section>
  );
}
