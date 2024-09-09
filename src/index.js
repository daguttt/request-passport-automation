import { writeFile } from 'node:fs/promises';
import 'dotenv/config';
import { chromium } from 'playwright';

const { DNI, NAMES, LASTNAMES, EMAIL, PHONE } = (() => {
  if (
    process.env.DNI &&
    process.env.NAMES &&
    process.env.LASTNAMES &&
    process.env.EMAIL &&
    process.env.PHONE
  )
    return {
      DNI: process.env.DNI,
      NAMES: process.env.NAMES,
      LASTNAMES: process.env.LASTNAMES,
      EMAIL: process.env.EMAIL,
      PHONE: process.env.PHONE,
    };

  throw new Error('Missing environment variables.');
})();

console.log({
  DNI,
  NAMES,
  LASTNAMES,
  EMAIL,
  PHONE,
});

// page1: Where the form will be (https://sedeelectronica.antioquia.gov.co/pasaporte/)
(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const initialPage = await context.newPage();
  await initialPage.goto(
    'https://sedeelectronica.antioquia.gov.co/publicaciones/227/pasaportes/'
  );
  await initialPage.getByRole('button', { name: 'Cerrar' }).click();

  // Get payment form page
  const paymentFormPage = await getValidPaymentFormPage(initialPage);

  // Do first passport payment
  await extractHtmlPageAndTakeScreenshot(paymentFormPage);
  await fillFirstPaymentForm(paymentFormPage);

  // await handOverControlToUser(pageToRequestPassport);
  //

  // Request appointment
  // await requestAppointment(page1);

  // ---------------------
  await context.close();
  await browser.close();
})();

/**
 *
 * @param {import('playwright').Page} initialPage
 * @param {number} retries
 */
async function getValidPaymentFormPage(initialPage, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const paymentFormPagePromise = initialPage.waitForEvent('popup');
    await initialPage
      .getByRole('link', { name: 'Realice el pago de su' })
      .click();
    const paymentFormPage = await paymentFormPagePromise;
    const isPageValid =
      (await paymentFormPage
        .getByText('Realice el pago de su pasaporte')
        .count()) === 1;

    if (isPageValid) return paymentFormPage;

    console.log();
    console.log('Could not get into the payment form page, retrying...');
    console.log();
    await paymentFormPage.close();
  }

  throw new Error('Could not get into the payment form page');
}

/**
 *
 * @param {import('playwright').Page} page
 */
async function fillFirstPaymentForm(page) {
  // -*******************************************************************************-
  console.log("Filling 'Tipo de identificación: *'");
  await page.getByLabel('Tipo de identificación: *').selectOption('1');

  console.log("Filling 'Número de identificación: *'");
  await page.getByLabel('Número de identificación: *').fill(DNI);

  console.log("Filling 'Confirmación Número de identificación: *'");
  await page.getByLabel('Confirmación Número de identificación: *').fill(DNI);

  console.log("Filling 'Nombres: *'");
  await page.getByLabel('Nombres: *').fill(NAMES);

  console.log("Filling 'Apellido: *'");
  await page.getByLabel('Apellido: *').fill(LASTNAMES);

  console.log("Filling 'Email: *'");
  await page.getByLabel('Email: *').fill(EMAIL);

  console.log("Filling 'Confirmación Email: *'");
  await page.getByLabel('Confirmación Email: *').fill(EMAIL);

  console.log("Filling 'Celular: *'");
  await page.getByLabel('Celular: *').fill(PHONE);

  console.log("Filling 'Acepto'");
  await page.getByLabel('Acepto').check();

  console.log("Focusing 'Tipo de pasaporte: *'");
  await page.getByLabel('Tipo de pasaporte: *').focus();

  console.log();
  console.log('-*********************************************************-');
  console.log(
    'NOW, SELECT THE TYPE OF PASSPORT AND CONTINUE WITH THE PAYMENT...'
  );
  console.log('-*********************************************************-');
  console.log();

  await handOverControlToUser(pageToRequestPassport);
  // -*******************************************************************************-
}

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
async function extractHtmlPageAndTakeScreenshot(page) {
  await page.waitForLoadState('domcontentloaded');
  const paymentPageBodyHtml = await page
    .locator('body')
    // .locator('.modContent')
    .innerHTML();

  console.log({ paymentPageBodyHtml: paymentPageBodyHtml });

  await writeFile('./output/payment-page.html', paymentPageBodyHtml);

  await page.screenshot({
    path: './output/full-screenshot.png',
    fullPage: true,
  });
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
