import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold">CareNav</h1>
      <p className="mt-4 text-neutral-600">
        An educational screening tool that helps families identify which
        Washington-state eldercare funding programs appear worth investigating
        with a professional. CareNav does not determine eligibility, provide
        legal or financial advice, or estimate benefit amounts.
      </p>
      <Link
        href="/intake"
        className="mt-8 inline-block rounded bg-neutral-900 px-4 py-2 text-white"
      >
        Start screening
      </Link>
    </main>
  );
}
