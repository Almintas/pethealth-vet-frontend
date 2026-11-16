# Browser end-to-end tests

Playwright tests that use both PetHealth apps the way people do: a vet
registers and is approved, creates a clinic, an owner shares a pet with a
one-time code, the clinic records a vaccination and attaches a lab result to
a medical record, the owner sees them with the activity log, downloads the
health passport PDF and the attached file, the clinic invites a
receptionist, and the owner revokes access.

They run in CI (`.github/workflows/e2e.yml` in pethealth-vet-frontend and
pethealth-frontend) against all four services built from `dev`. This folder
has its own `package.json` so the app's lockfile is not affected.

To run locally, start both APIs and both apps (see the main README), then:

```bash
cd e2e
npm install
npx playwright install chromium
VET_BACKEND_DIR=../../pethealth-vet-backend \
MONGODB_URI=mongodb://localhost:27017/pethealth_vet_dev \
npx playwright test
```

`VET_BACKEND_DIR` and `MONGODB_URI` (the clinic database) are used to approve
the test vet with `scripts/approve-veterinarian.mjs`.
