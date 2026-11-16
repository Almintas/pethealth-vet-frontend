import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  OWNER_APP,
  PASSWORD,
  RUN,
  VET_APP,
  acceptDialogs,
  approveVet,
  todayIso,
  totpCode,
} from './helpers';

/**
 * One realistic journey through both apps, in order. Each step builds on the
 * previous one, so the suite runs serially with a page per person.
 */
test.describe.configure({ mode: 'serial' });

const vetEmail = `vet-${RUN}@e2e.test`;
const ownerEmail = `owner-${RUN}@e2e.test`;
const deskEmail = `desk-${RUN}@e2e.test`;
const clinicName = `E2E Clinic ${RUN}`;
const petName = `Luna ${RUN.slice(-4)}`;

let vetPage: Page;
let ownerPage: Page;
let shareCode = '';
let inviteUrl = '';
let petPath = '';

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  acceptDialogs(page);
  return page;
}

test.beforeAll(async ({ browser }) => {
  vetPage = await newPage(browser);
  ownerPage = await newPage(browser);
});

// The report artifact is not always reachable, so print what each person
// sees when a step fails.
test.afterEach(async ({}, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }
  for (const [who, page] of [
    ['vet', vetPage],
    ['owner', ownerPage],
  ] as const) {
    if (!page || page.isClosed()) {
      continue;
    }
    const snapshot = await page
      .locator('body')
      .ariaSnapshot({ timeout: 5_000 })
      .catch((error: unknown) => `(no snapshot: ${String(error)})`);
    console.log(`\n----- ${who} page at ${page.url()} -----\n${snapshot.slice(0, 6000)}`);
  }
});

test.afterAll(async () => {
  await vetPage?.context().close();
  await ownerPage?.context().close();
});

test('vet registers and waits for approval', async () => {
  await vetPage.goto(`${VET_APP}/register`);
  await vetPage.getByLabel('First name').fill('Ona');
  await vetPage.getByLabel('Last name').fill('Vet');
  await vetPage.getByLabel('Email').fill(vetEmail);
  await vetPage.getByLabel('Password').fill(PASSWORD);
  await vetPage.getByLabel('Veterinary practice licence number').fill(`VET-${RUN}`);
  await vetPage.getByRole('button', { name: 'Create account' }).click();

  await expect(vetPage.getByRole('heading', { name: 'Account awaiting approval' })).toBeVisible();
  await expect(vetPage.getByText(`VET-${RUN}`, { exact: true })).toBeVisible();
});

test('approved vet creates a clinic from the dashboard prompt', async () => {
  approveVet(vetEmail);
  await vetPage.getByRole('button', { name: 'Check again' }).click();

  await expect(vetPage.getByText('Create a clinic to get started')).toBeVisible();
  await vetPage.getByRole('link', { name: 'Create clinic' }).click();
  await expect(vetPage).toHaveURL(/\/clinics$/);

  await vetPage.getByRole('button', { name: 'Create clinic' }).click();
  const dialog = vetPage.getByRole('dialog', { name: 'Create a clinic' });
  await dialog.getByLabel('Clinic name').fill(clinicName);
  await dialog.getByLabel('Phone').fill('+370 600 00000');
  await dialog.getByRole('button', { name: 'Create clinic' }).click();
  await expect(dialog).toBeHidden();

  await expect(vetPage.getByRole('heading', { name: clinicName, level: 1 })).toBeVisible();
  await expect(vetPage.getByRole('heading', { name: 'Team', exact: true })).toBeVisible();
});

test('owner registers and adds a pet', async () => {
  await ownerPage.goto(`${OWNER_APP}/register`);
  await ownerPage.getByLabel('First name').fill('Jane');
  await ownerPage.getByLabel('Last name').fill('Owner');
  await ownerPage.getByLabel('Email').fill(ownerEmail);
  await ownerPage.getByLabel('Password').fill(PASSWORD);
  await ownerPage.getByRole('button', { name: 'Sign up' }).click();
  await expect(ownerPage).not.toHaveURL(/\/register/);

  await ownerPage.goto(`${OWNER_APP}/pets`);
  await ownerPage.getByRole('button', { name: 'Add pet' }).first().click();
  await ownerPage.locator('input[name="name"]').fill(petName);
  const species = ownerPage.getByRole('combobox', { name: /Species/ });
  await species.fill('Cat');
  await species.press('Tab');
  await ownerPage.getByRole('button', { name: 'Create pet' }).last().click();

  await ownerPage.getByRole('link', { name: new RegExp(petName) }).first().click();
  await expect(ownerPage).toHaveURL(/\/pets\/[a-f0-9]{24}$/);
  petPath = new URL(ownerPage.url()).pathname;
});

test('owner creates a one-time code for the clinic', async () => {
  await ownerPage.getByRole('button', { name: 'Create code for clinic' }).click();
  const code = ownerPage.locator('.clinic-access-section__code');
  await expect(code).toHaveText(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  shareCode = (await code.textContent())?.trim() ?? '';
  await expect(ownerPage.getByText(/Valid for \d+:\d{2}/)).toBeVisible();
});

test('vet adds the pet with the owner code', async () => {
  await vetPage.goto(`${VET_APP}/patients`);
  await vetPage.getByRole('button', { name: 'Add by owner code' }).click();
  const dialog = vetPage.getByRole('dialog', { name: 'Add patient by code' });
  await dialog.getByLabel('Owner code').fill(shareCode.replace('-', '').toLowerCase());
  await expect(dialog.getByLabel('Owner code')).toHaveValue(shareCode);
  await dialog.getByRole('button', { name: 'Add patient' }).click();

  await expect(vetPage).toHaveURL(/\/patients\/[a-f0-9]{24}$/);
  await expect(vetPage.getByText(petName).first()).toBeVisible();
});

test('the same code is rejected the second time', async () => {
  await vetPage.goto(`${VET_APP}/patients`);
  await vetPage.getByRole('button', { name: 'Add by owner code' }).click();
  const dialog = vetPage.getByRole('dialog', { name: 'Add patient by code' });
  await dialog.getByLabel('Owner code').fill(shareCode);
  await dialog.getByRole('button', { name: 'Add patient' }).click();
  await expect(dialog.getByText(/invalid or has expired/i)).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
});

test('vet records a vaccination', async () => {
  await vetPage.getByRole('link', { name: new RegExp(petName) }).first().click();
  await expect(vetPage).toHaveURL(/\/patients\/[a-f0-9]{24}$/);
  await vetPage.getByRole('button', { name: '+ Add vaccination' }).first().click();
  const dialog = vetPage.getByRole('dialog', { name: 'Add vaccination' });
  await dialog.getByLabel(/Vaccine \/ product/).fill('Rabies');
  await dialog.getByLabel(/Date administered/).fill(todayIso());
  await dialog.getByRole('button', { name: 'Add vaccination' }).click();
  await expect(dialog).toBeHidden();
  await expect(vetPage.getByText('Rabies').first()).toBeVisible();
});

test('owner sees the vaccination, the clinic and the activity log', async () => {
  await ownerPage.goto(`${OWNER_APP}${petPath}`);
  await expect(ownerPage.getByText('Rabies').first()).toBeVisible();

  const access = ownerPage.locator('#clinic-access');
  await expect(access.getByText(clinicName)).toBeVisible();

  const activity = ownerPage.locator('#pet-activity');
  await expect(activity.getByText('got access with your code')).toBeVisible();
  await expect(activity.getByText('recorded a vaccination')).toBeVisible();
  await expect(activity.getByText(`Ona Vet · ${clinicName}`).first()).toBeVisible();
});

test('owner downloads the health passport as a PDF', async () => {
  const downloadPromise = ownerPage.waitForEvent('download');
  await ownerPage.getByRole('button', { name: 'Health passport (PDF)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^health-passport-luna-[a-z0-9]+-\d{4}-\d{2}-\d{2}\.pdf$/,
  );

  const pdf = readFileSync(await download.path()).toString('latin1');
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
  // Text is drawn as hex strings of one-byte codes; ASCII keeps its code.
  const shown = (text: string) => `<${Buffer.from(text, 'latin1').toString('hex')}>`;
  expect(pdf).toContain(shown(petName));
  expect(pdf).toContain(shown('Rabies'));
});

test('clinic admin invites a receptionist who joins from the link', async ({ browser }) => {
  await vetPage.goto(`${VET_APP}/clinics`);
  const team = vetPage.locator('.clinic-team');
  await team.getByLabel('Email').fill(deskEmail);
  await team.getByLabel('Role').selectOption({ label: 'Receptionist' });
  await team.getByRole('button', { name: 'Send invitation' }).click();

  const link = team.getByLabel('Invitation link');
  await expect(link).toHaveValue(/\/invite\?token=/);
  inviteUrl = await link.inputValue();
  await expect(team.getByText(deskEmail, { exact: true }).first()).toBeVisible();

  const deskPage = await newPage(browser);
  try {
    await deskPage.goto(inviteUrl);
    await expect(deskPage.getByText(new RegExp(clinicName))).toBeVisible();
    await deskPage.getByLabel('First name').fill('Rita');
    await deskPage.getByLabel('Last name').fill('Desk');
    await deskPage.getByLabel('Password').fill(PASSWORD);
    await expect(deskPage.getByLabel(/licence number/i)).toHaveCount(0);
    await deskPage.getByRole('button', { name: 'Create account and join' }).click();

    await expect(deskPage).toHaveURL(/\/dashboard$/);
    await deskPage.goto(`${VET_APP}/patients`);
    await expect(deskPage.getByText(petName).first()).toBeVisible();

    await deskPage.goto(`${VET_APP}/clinics`);
    await expect(deskPage.getByText('Receptionist').first()).toBeVisible();
    await expect(deskPage.getByRole('button', { name: 'Send invitation' })).toHaveCount(0);
  } finally {
    await deskPage.context().close();
  }

  await vetPage.reload();
  await expect(vetPage.locator('.clinic-team').getByText('Rita Desk')).toBeVisible();
});

test('owner revokes access and the clinic loses the pet', async () => {
  await ownerPage.goto(`${OWNER_APP}${petPath}`);
  const access = ownerPage.locator('#clinic-access');
  await access.getByRole('button', { name: 'Revoke access' }).click();
  await expect(access.getByText('No clinic has access to this pet yet.')).toBeVisible();
  await expect(
    ownerPage.locator('#pet-activity').getByText('revoked a clinic’s access'),
  ).toBeVisible();

  await vetPage.goto(`${VET_APP}/patients`);
  await expect(vetPage.getByText(petName)).toHaveCount(0);
});

test('owner downloads their data, then deletes the account', async () => {
  await ownerPage.goto(`${OWNER_APP}/settings`);

  const downloadPromise = ownerPage.waitForEvent('download');
  await ownerPage.getByRole('button', { name: 'Download my data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^pethealth-data-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  const exported = JSON.parse(readFileSync(path, 'utf8')) as {
    account: { email: string };
    pets: { name: string; vaccinations: { vaccineName: string }[] }[];
  };
  expect(exported.account.email).toBe(ownerEmail);
  const pet = exported.pets.find((entry) => entry.name === petName);
  expect(pet?.vaccinations.map((v) => v.vaccineName)).toContain('Rabies');

  await ownerPage.getByRole('button', { name: 'Delete account' }).click();
  await ownerPage.getByLabel('Enter your password to confirm').fill('wrong-password-1');
  await ownerPage.getByLabel(/I understand my account/).check();
  await ownerPage.getByRole('button', { name: 'Delete account permanently' }).click();
  await expect(ownerPage.getByText('The password is not correct.')).toBeVisible();

  await ownerPage.getByLabel('Enter your password to confirm').fill(PASSWORD);
  await ownerPage.getByRole('button', { name: 'Delete account permanently' }).click();
  await expect(ownerPage).toHaveURL(/\/login/);
  await expect(ownerPage.getByText('Your account and all its data have been deleted.')).toBeVisible();

  await ownerPage.getByLabel('Email').fill(ownerEmail);
  await ownerPage.getByLabel('Password').fill(PASSWORD);
  await ownerPage.getByRole('button', { name: 'Sign in' }).click();
  await expect(ownerPage.getByText('Invalid email or password.')).toBeVisible();
});

test('vet turns on two-factor sign-in and signs in with a code', async () => {
  await vetPage.goto(`${VET_APP}/profile`);
  const card = vetPage.locator('.two-factor-card');
  await expect(card.getByText('Off', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Turn on' }).click();

  const key = ((await card.locator('.two-factor-card__key').textContent()) ?? '').replace(/\s+/g, '');
  expect(key).toMatch(/^[A-Z2-7]{32}$/);
  await card.getByLabel('Code').fill(totpCode(key));
  await card.getByRole('button', { name: 'Confirm and turn on' }).click();

  await expect(card.getByText('Save your recovery codes')).toBeVisible();
  const recoveryCode = ((await card.locator('.two-factor-card__code-list code').first().textContent()) ?? '').trim();
  expect(recoveryCode).toMatch(/^[a-f0-9]{5}-[a-f0-9]{5}$/);
  await card.getByRole('button', { name: 'I have saved them' }).click();
  await expect(card.getByText('On', { exact: true })).toBeVisible();

  // Sign out and back in: the password alone is no longer enough.
  await vetPage.evaluate(() => localStorage.removeItem('pethealth.vet.accessToken'));
  await vetPage.goto(`${VET_APP}/login`);
  await vetPage.getByLabel('Email').fill(vetEmail);
  await vetPage.getByLabel('Password').fill(PASSWORD);
  await vetPage.getByRole('button', { name: 'Sign in' }).click();
  await expect(vetPage.getByRole('heading', { name: 'Enter your verification code' })).toBeVisible();

  await vetPage.getByLabel('Code').fill('000000');
  await vetPage.getByRole('button', { name: 'Sign in' }).click();
  await expect(vetPage.getByText('That code is not valid', { exact: false })).toBeVisible();

  await vetPage.getByLabel('Code').fill(recoveryCode);
  await vetPage.getByRole('button', { name: 'Sign in' }).click();
  await expect(vetPage).toHaveURL(/\/dashboard$/);
});
