/* eslint-disable */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const targetUrl = 'http://localhost:3000';
const brainDir = 'C:\\Users\\PXNDA\\.gemini\\antigravity\\brain\\c040f761-574e-4b0a-aacc-cb751c87397c';

const routes = [
  { name: '1_login', path: '/login', requiresAuth: false },
  { name: '2_dashboard_owner', path: '/dashboard/owner', requiresAuth: true },
  { name: '3_crm_deprecated', path: '/dashboard/crm', requiresAuth: true },
  { name: '4_customers', path: '/dashboard/customers', requiresAuth: true },
  { name: '5_vehicles', path: '/dashboard/vehicles', requiresAuth: true },
  { name: '6_repair', path: '/dashboard/repair', requiresAuth: true },
  { name: '7_inventory', path: '/dashboard/inventory', requiresAuth: true },
  { name: '8_pos', path: '/dashboard/pos', requiresAuth: true },
  { name: '9_warranty', path: '/dashboard/warranty', requiresAuth: true },
  { name: '10_booking', path: '/dashboard/booking', requiresAuth: true },
  { name: '11_settings_dashboard', path: '/dashboard/settings', requiresAuth: true },
  { name: '11_settings_root', path: '/settings', requiresAuth: true }
];

async function run() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const logs = [];
  const errors = [];

  // Listen to console and page errors
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(`[Console][${msg.type()}] ${text}`);
    console.log(`[Browser Console] ${text}`);
  });

  page.on('pageerror', (err) => {
    errors.push(`[PageError] ${err.toString()}`);
    console.error(`[Browser Error] ${err.toString()}`);
  });

  try {
    // 1. Visit Login page & screenshot
    console.log('Visiting Login Page...');
    await page.goto(`${targetUrl}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(brainDir, 'screenshot_1_login.png') });
    console.log('Saved login screenshot.');

    // 2. Perform Login
    console.log('Entering login credentials...');
    await page.type('input[type="email"]', 'superadmin@denmodify.com');
    await page.type('input[type="password"]', '123456789');
    
    console.log('Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    console.log('Logged in successfully!');

    // Wait extra time for dashboard to load
    await new Promise(r => setTimeout(r, 4000));

    // 3. Loop through other routes
    for (const route of routes) {
      if (route.name === '1_login') continue;

      console.log(`Navigating to ${route.path}...`);
      await page.goto(`${targetUrl}${route.path}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 3000)); // wait 3s for static rendering / API calls

      const screenshotName = `screenshot_${route.name}.png`;
      await page.screenshot({ path: path.join(brainDir, screenshotName) });
      console.log(`Saved screenshot for ${route.name}`);
    }

    // 4. Perform Logout via click
    console.log('Performing logout via UI button...');
    await page.goto(`${targetUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Find log out button
    const logoutBtn = await page.$('button'); // find standard button or loop them
    if (logoutBtn) {
      console.log('Clicking logout button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const logout = buttons.find(b => b.textContent.includes('ออกจากระบบ'));
        if (logout) logout.click();
      });
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(brainDir, 'screenshot_12_logout.png') });
      console.log('Saved logout screenshot.');
    }

  } catch (err) {
    console.error('E2E run encountered error:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');

    // Save logs and errors to a JSON file for E2E validation report parsing
    const reportData = {
      timestamp: new Date().toISOString(),
      consoleLogs: logs,
      pageErrors: errors
    };
    fs.writeFileSync(path.join(brainDir, 'e2e_console_output.json'), JSON.stringify(reportData, null, 2));
    console.log('Saved E2E console outputs to json.');
  }
}

run();
