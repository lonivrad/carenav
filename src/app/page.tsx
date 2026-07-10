import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-16 sm:py-24">
      <p className="text-body font-semibold uppercase tracking-wide text-accent-secondary">
        Washington State care funding
      </p>

      <h1 className="mt-6 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-accent sm:text-5xl md:text-hero">
        Find the programs worth exploring.
      </h1>

      <p className="mt-8 max-w-2xl text-body text-text-body">
        CareNav is an educational screening tool that helps families identify
        Washington programs that may help pay for long-term care, support at
        home, and caregiving needs. It does not determine eligibility, provide
        legal or financial advice, or estimate benefit amounts.
      </p>

      <div className="mt-grid-gap flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/intake"
          className="inline-flex items-center justify-center rounded-cta bg-accent px-8 py-4 text-body font-semibold text-text-on-dark transition-colors duration-[var(--duration-nav)] hover:bg-accent-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start screening
        </Link>
        <span className="text-body text-text-body">
          Takes about 10 minutes. Nothing is guessed on your behalf.
        </span>
      </div>
    </main>
  );
}
