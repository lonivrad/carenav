# CareNav

An educational screening tool that helps families identify which Washington-state
eldercare funding programs appear worth investigating with a professional.

CareNav does **not** determine eligibility, provide legal or financial advice, or
estimate benefit amounts.

Architecture and governance documentation: see `docs/` (to be completed in Phase 8).

## Development

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY and VOYAGE_API_KEY
npm install
npm run dev
npm test
```
