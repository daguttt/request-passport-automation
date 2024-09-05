import { writeFile } from 'node:fs/promises';
import 'dotenv/config';
import { chromium } from 'playwright';

import { getMonthNumber } from './getMonthNumber.js';

const MONTH = process.env.MONTH || 'Septiembre';

console.log({ MONTH });

const monthNumber = getMonthNumber(MONTH);
const DAY = process.env.DAY || '3';

console.log({ monthNumber, DAY });

// page1: Where the form will be (https://sedeelectronica.antioquia.gov.co/pasaporte/)
(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(
    'https://sedeelectronica.antioquia.gov.co/publicaciones/227/pasaportes/'
  );
  await page.getByRole('button', { name: 'Cerrar' }).click();
  const pageToRequestPassportPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Realice el pago de su' }).click();
  const pageToRequestPassport = await pageToRequestPassportPromise;

  // Request appointment
  // await requestAppointment(page1);

  // Do first passport payment
  await extractPossibleHtmlForm(pageToRequestPassport);

  await handOverControlToUser(pageToRequestPassport);

  // ---------------------
  await context.close();
  await browser.close();
})();

// User takes control from here
// await page1.waitForTimeout(1000 * 60 * 60);

/**
 *
 * @param {import('playwright').Page} page
 */
async function handOverControlToUser(page) {
  await page.waitForTimeout(1000 * 60 * 60);
}

/**
 *
 * @param {import('playwright').Page} page
 */
async function extractPossibleHtmlForm(page) {
  const possibleFormContainerHtml = await page
    .locator('.modMenuContainer')
    // .locator('.modContent')
    .innerHTML();

  console.log({ possibleFormContainerHtml });
  await writeFile(
    './output/possible-form-container.html',
    possibleFormContainerHtml
  );

  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: './output/screenshot.png' });
}

/**
 *
 * @param {import('playwright').Page} page
 */
async function requestAppointment(page) {
  await page
    .getByRole('link', { name: 'Solicitar cita Solicitar cita' })
    .click();
  await page.getByLabel('Número de identificación: *').fill('1000747179');
  await page.getByLabel('Tipo de solicitud: *').selectOption('1');
  await page.getByLabel('Acepto').check();
  await page.locator('input.hasDatepicker').click();
  await page
    .locator(`[data-month="${monthNumber}"][data-year="2024"]`)
    .filter({ has: page.getByRole('link', { name: DAY, exact: true }) })
    .click();

  // User takes control from here
  await handOverControlToUser(page);
}
