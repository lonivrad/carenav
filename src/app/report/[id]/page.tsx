interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Report {id}</h1>
      {/* TODO: render generated report (programs, unknowns, next steps) */}
    </main>
  );
}
