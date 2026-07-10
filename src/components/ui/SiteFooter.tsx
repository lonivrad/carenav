/**
 * Quiet, app-wide trust footer. States that CareNav is independent and
 * educational-only, and that program administrators make the actual
 * eligibility decisions. Deliberately understated — a hairline top rule and
 * muted text in the existing type system, no banner/alert/shadow.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 px-6 py-6 text-sm leading-relaxed">
      <div className="mx-auto max-w-3xl space-y-1 text-neutral-600">
        <p>
          CareNav is an independent educational tool and is not affiliated with
          Washington State or any government agency.
        </p>
        <p className="text-neutral-500">
          Educational screening only. Final eligibility decisions are made by
          program administrators.
        </p>
      </div>
    </footer>
  );
}
