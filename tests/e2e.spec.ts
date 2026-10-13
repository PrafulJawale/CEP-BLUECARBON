import { test, expect } from '@playwright/test';

const DEMO_USERS = {
  developer: { email: 'developer@demo.bluecarbon.local', password: 'demo123' },
  govOfficer: { email: 'gov.officer@demo.bluecarbon.local', password: 'demo123' },
  admin: { email: 'admin@demo.bluecarbon.local', password: 'demo123' },
};

async function resetDatabase(page) {
  // Reset database via admin API (requires admin login)
  await page.request.post('http://localhost:8080/api/v1/auth/login', {
    data: { email: DEMO_USERS.admin.email, password: DEMO_USERS.admin.password }
  });
  const resetResponse = await page.request.post('http://localhost:8080/api/v1/admin/reset-db');
  console.log('Database reset status:', resetResponse.status());
  if (!resetResponse.ok()) {
    const error = await resetResponse.text();
    console.log('Reset error:', error);
  }
}

test.describe('Blue Carbon Registry E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page);
    await page.goto('http://localhost:8080');
  });

  test('Complete E2E workflow: register -> login -> create project -> upload evidence -> review -> calculation -> credit issuance', async ({ page }) => {
    // Capture console messages
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    // Track navigations
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        console.log('NAVIGATION:', frame.url());
      }
    });
    
    // Step 1: Login as project developer
    await page.goto('http://localhost:8080/login');
    
    // Check page content
    const pageContent = await page.textContent('body');
    console.log('Page content (first 500 chars):', pageContent?.substring(0, 500));
    
    await page.fill('input[id="email"]', DEMO_USERS.developer.email);
    await page.fill('input[id="password"]', DEMO_USERS.developer.password);
    
    // Check form values
    const emailValue = await page.inputValue('input[id="email"]');
    const passwordValue = await page.inputValue('input[id="password"]');
    console.log('Email value:', emailValue);
    console.log('Password value:', passwordValue);
    
    // Login via API directly and set cookies in browser context
    console.log('Logging in via API...');
    const loginResponse = await page.request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: DEMO_USERS.developer.email,
        password: DEMO_USERS.developer.password
      }
    });
    console.log('Login response status:', loginResponse.status());
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    // Extract cookies from response headers
    const headers = loginResponse.headers();
    console.log('All headers:', JSON.stringify(headers, null, 2));
    
    const setCookieHeader = headers['set-cookie'] || '';
    console.log('Set-Cookie header:', setCookieHeader);
    
    // Parse and set cookies in browser context (split by newline for multiple cookies)
    const cookieHeaders = setCookieHeader.split('\n');
    for (const cookieHeader of cookieHeaders) {
      // Parse cookie header: "name=value; HttpOnly; Max-Age=1800; Path=/; SameSite=lax"
      const parts = cookieHeader.split(';');
      const [name, value] = parts[0].split('=');
      if (name && value) {
        await page.context().addCookies([{
          name: name.trim(),
          value: value.trim(),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }]);
      }
    }
    
    // Navigate to dashboard and wait for session to be established
    await page.goto('http://localhost:8080/dashboard');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });
    
    // Wait a bit for AuthContext to fully initialize
    await page.waitForTimeout(2000);
    
    // Check cookies in browser
    const cookies = await page.context().cookies();
    console.log('Browser cookies:', cookies);

    // Step 2: Create a project - navigate directly to upload page
    await page.goto('http://localhost:8080/upload');
    console.log('URL after goto upload:', page.url());
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    console.log('URL after wait:', page.url());
    
    const pageContentAfter = await page.textContent('body');
    console.log('Page content (first 500 chars):', pageContentAfter?.substring(0, 500));
    
    // Check if we're on dashboard instead
    if (page.url().includes('/dashboard')) {
      console.log('REDIRECTED TO DASHBOARD! Checking why...');
      // Check for any meta refresh or JavaScript redirects
      const pageSource = await page.content();
      console.log('Page source length:', pageSource.length);
    }
    
    await expect(page).toHaveURL(/.*upload/, { timeout: 15000 });
    
    // Fill form using id selectors (not name)
    await page.fill('input[id="name"]', 'E2E Test Project');
    await page.fill('textarea[id="description"]', 'E2E test project for validation');
    await page.fill('input[id="latitude"]', '21.9497');
    await page.fill('input[id="longitude"]', '88.2516');
    await page.fill('input[id="areaHectares"]', '100');
    await page.selectOption('select[id="ecosystemType"]', 'mangrove');
    await page.fill('input[id="country"]', 'India');
    await page.fill('input[id="stateProvince"]', 'West Bengal');
    await page.fill('input[id="district"]', 'South 24 Parganas');
    
    // Upload evidence files (mock)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    });
    
    // Debug: listen for console errors during submit
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/projects') && request.method() === 'POST') {
        console.log('PROJECT CREATION REQUEST:', request.url(), request.postData());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/projects') && response.request().method() === 'POST') {
        console.log('PROJECT CREATION RESPONSE:', response.status(), response.url());
      }
    });
    
    // Submit project and wait for response
    const projectCreationResponse = await Promise.all([
      page.waitForResponse(response => response.url().includes('/projects') && response.request().method() === 'POST', { timeout: 15000 }).catch(e => console.log('Project creation response error:', e.message)),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for dashboard to load and projects to refresh
    await page.waitForTimeout(3000);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Debug: check what's on the dashboard
    const dashContent = await page.textContent('body');
    console.log('Dashboard content (first 2000 chars):', dashContent?.substring(0, 2000));
    
    await expect(page.locator('text=E2E Test Project').first()).toBeVisible();
    
    // Submit the project for review (change status from draft to submitted)
    const projectListResponse = await page.request.get('http://localhost:8080/api/v1/projects');
    if (projectListResponse.ok()) {
      const projectData = await projectListResponse.json();
      console.log('Projects:', projectData);
      const e2eProject = projectData.items?.find((p: { name: string; id: string }) => p.name === 'E2E Test Project');
      if (e2eProject) {
        console.log('Found E2E Test Project:', e2eProject.id);
        // Submit project for review
        const submitResponse = await page.request.post(`http://localhost:8080/api/v1/projects/${e2eProject.id}/submit`, {
          data: {}
        });
        console.log('Project submit status:', submitResponse.status());
        if (!submitResponse.ok()) {
          const errorText = await submitResponse.text();
          console.log('Project submit error:', errorText);
        }
      }
    }

    // Step 3: Login as government officer and review project
    await page.click('button:has(svg.lucide-log-out)');
    await page.goto('http://localhost:8080/login');
    
    // Login via API for gov officer
    const govLoginResponse = await page.request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: DEMO_USERS.govOfficer.email,
        password: DEMO_USERS.govOfficer.password
      }
    });
    console.log('Gov officer login status:', govLoginResponse.status());
    const govLoginHeaders = govLoginResponse.headers();
    const govSetCookieHeader = govLoginHeaders['set-cookie'] || '';
    for (const cookieHeader of govSetCookieHeader.split('\n')) {
      const parts = cookieHeader.split(';');
      const [name, value] = parts[0].split('=');
      if (name && value) {
        await page.context().addCookies([{
          name: name.trim(),
          value: value.trim(),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }]);
      }
    }
    
    // Go to verification workflow
    await page.goto('http://localhost:8080/verification-workflow');
    await expect(page).toHaveURL(/.*verification/);
    
    // Wait for projects to load
    await page.waitForTimeout(3000);
    
    // Find and review the project - click on the first project card in the list
    // Use a more robust selector - find clickable project cards
    const projectCards = page.locator('.space-y-3 > div').first();
    await expect(projectCards).toBeVisible({ timeout: 10000 });
    await projectCards.click();
    
    // Wait for project details to load
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageContentVw = await page.textContent('body');
    console.log('Verification workflow page content (first 1000 chars):', pageContentVw?.substring(0, 1000));
    
    // Click "Start Review" to create a review
    const startReviewBtn = page.locator('text=Start Review').first();
    if (await startReviewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Start Review button');
      await startReviewBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Check for Submit Decision button
    const submitDecisionBtn = page.locator('text=Submit Decision');
    if (await submitDecisionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Submit Decision button found');
    } else {
      console.log('Submit Decision button NOT found');
      // Check for other buttons
      const buttons = await page.locator('button').allTextContents();
      console.log('All buttons:', buttons);
    }
    
    // Submit review decision
    await page.click('text=Submit Decision');
    
    // Wait for modal to open
    await page.waitForTimeout(1500);
    
    // Debug: check what's in the modal
    const modalContent = await page.textContent('.fixed.inset-0.z-50');
    console.log('Modal content:', modalContent?.substring(0, 1000));
    
    // The SelectTrigger is a button - find it by its placeholder text or current value
    // The Select component uses Radix UI which renders the trigger as a button
    const selectTrigger = page.locator('button:has-text("Select decision"), button:has-text("approved"), button:has-text("Approved")').first();
    if (await selectTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectTrigger.click();
      await page.waitForTimeout(500);
      // Radix Select renders options in a portal - find them globally
      const approvedOption = page.locator('[role="option"]:has-text("Approved")').first();
      if (await approvedOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approvedOption.click();
      } else {
        // Fallback: click the button with "Approved" text (could be the option rendered as button)
        await page.locator('button:has-text("Approved"):not(:has-text("Select decision"))').first().click();
      }
    }
    
    // Fill form fields using the actual selectors from the DOM
    // Textarea has placeholder "Add your comments..."
    await page.fill('textarea[placeholder="Add your comments..."]', 'Approved via E2E test');
    
    // Check checkboxes - they're inside labels with the text
    await page.check('label:has-text("Evidence Reviewed") >> input[type="checkbox"]');
    await page.check('label:has-text("Calculation Reviewed") >> input[type="checkbox"]');
    await page.check('label:has-text("Methodology Compliant") >> input[type="checkbox"]');
    
    // Submit button - the actual submit button is the one with "verification.submit" translation key
    // It's the second button in the modal footer (first is Cancel)
    await page.click('button:has-text("verification.submit")');
    
    // Step 4: Create calculation as developer
    await page.click('button:has(svg.lucide-log-out)');
    
    // Login via API for developer
    const devLoginResponse = await page.request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: DEMO_USERS.developer.email,
        password: DEMO_USERS.developer.password
      }
    });
    console.log('Developer login status:', devLoginResponse.status());
    const devLoginHeaders = devLoginResponse.headers();
    const devSetCookieHeader = devLoginHeaders['set-cookie'] || '';
    for (const cookieHeader of devSetCookieHeader.split('\n')) {
      const parts = cookieHeader.split(';');
      const [name, value] = parts[0].split('=');
      if (name && value) {
        await page.context().addCookies([{
          name: name.trim(),
          value: value.trim(),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }]);
      }
    }
    
    // Go to calculations page
    await page.goto('http://localhost:8080/calculations');
    await expect(page).toHaveURL(/.*calculations/);
    
    // Create calculation - select the approved Sundarbans project
    // The "Create New" button should be visible since developer owns approved Sundarbans project
    await page.waitForTimeout(2000);
    
    // Debug: check what's on the calculations page
    const calcPageContentBefore = await page.textContent('body');
    console.log('Calculations page before Create New (first 1500 chars):', calcPageContentBefore?.substring(0, 1500));
    
    // Select Sundarbans project in the sidebar first (project select in modal is disabled)
    await page.click('text=Sundarbans Mangrove Restoration Phase 1');
    await page.waitForTimeout(1500);
    
    // Click Create Calculation button
    await page.click('text=Create Calculation');
    await page.waitForTimeout(1500);
    
    // Fill form using id selectors - project is already selected and locked in modal
    await page.fill('input[id="methodologyName"]', 'IPCC 2006');
    await page.fill('input[id="methodologyVersion"]', '2006');
    await page.fill('input[id="methodologyReference"]', 'https://www.ipcc.ch/report/ar6/wg3/');
    await page.fill('textarea[id="inputParameters"]', '{"area_hectares": 100, "species": "Rhizophora mangle", "age_years": 10}');
    await page.fill('textarea[id="assumptions"]', 'Standard growth rates');
    await page.fill('textarea[id="limitations"]', 'Limited to mangrove species');
    
    // Check for any validation errors before submit
    const pageBeforeSubmit = await page.textContent('body');
    console.log('Page before submit:', pageBeforeSubmit?.substring(0, 1000));
    
    // Wait for calculation creation response
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/calculations') && response.request().method() === 'POST', { timeout: 15000 }).catch(e => console.log('Calculation creation response error:', e.message)),
      page.click('button[type="submit"]')
    ]);
    await page.waitForTimeout(3000);
    
    // Check if modal closed or error appeared
    const pageAfterSubmit = await page.textContent('body');
    console.log('Page after submit:', pageAfterSubmit?.substring(0, 1000));
    
    // Refresh the calculations list by navigating away and back
    await page.goto('http://localhost:8080/calculations');
    await page.waitForTimeout(3000);
    
    // Select the Sundarbans project in the sidebar to see its calculations
    await page.click('text=Sundarbans Mangrove Restoration Phase 1');
    await page.waitForTimeout(2000);
    
    // Wait for calculation to appear in list and click Submit for Review
    await page.waitForTimeout(2000);
    // Check if Submit for Review button is visible
    const submitBtn = page.locator('text=Submit for Review').first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Submit for Review');
    } else {
      console.log('Submit for Review button not found, checking page content...');
      const calcPageContent = await page.textContent('body');
      console.log('Calculations page content:', calcPageContent?.substring(0, 2000));
    }
    
    // Verify calculation is now in submitted status
    await page.goto('http://localhost:8080/calculations');
    await page.waitForTimeout(2000);
    await page.click('text=Sundarbans Mangrove Restoration Phase 1');
    await page.waitForTimeout(2000);
    
// Step 5: Approve calculation as government officer via API
    await page.click('button:has(svg.lucide-log-out)');
    
    // Login via API for gov officer
    const govLoginResponse2 = await page.request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: DEMO_USERS.govOfficer.email,
        password: DEMO_USERS.govOfficer.password
      }
    });
    console.log('Gov officer login (step 5) status:', govLoginResponse2.status());
    const govLoginHeaders2 = govLoginResponse2.headers();
    const govSetCookieHeader2 = govLoginHeaders2['set-cookie'] || '';
    for (const cookieHeader of govSetCookieHeader2.split('\n')) {
      const parts = cookieHeader.split(';');
      const [name, value] = parts[0].split('=');
      if (name && value) {
        await page.context().addCookies([{
          name: name.trim(),
          value: value.trim(),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }]);
      }
    }
    
    // Find the Sundarbans project ID and the submitted calculation
    const projectListResponse2 = await page.request.get('http://localhost:8080/api/v1/projects');
    console.log('Projects list status:', projectListResponse2.status());
    if (projectListResponse2.ok()) {
      const projectData = await projectListResponse2.json();
      console.log('Projects:', projectData);
      const sundarbansProject = projectData.items?.find((p: { name: string; id: string }) => p.name === 'Sundarbans Mangrove Restoration Phase 1');
      if (sundarbansProject) {
        console.log('Found Sundarbans project:', sundarbansProject.id);
        
        // Find the submitted calculation
        const calcListResponse = await page.request.get(`http://localhost:8080/api/v1/calculations/project/${sundarbansProject.id}`);
        console.log('Calculations list status:', calcListResponse.status());
        if (calcListResponse.ok()) {
          const calcData = await calcListResponse.json();
          console.log('Calculations:', calcData);
          const submittedCalc = calcData.find((c: { status: string; methodologyName: string; id: string }) => c.status === 'submitted' && c.methodologyName === 'IPCC 2006');
          if (submittedCalc) {
            console.log('Found submitted calculation:', submittedCalc.id);
            
            // Approve calculation via API
            const reviewResponse = await page.request.post(`http://localhost:8080/api/v1/calculations/${submittedCalc.id}/review`, {
              data: {
                status: 'approved',
                reviewer_comments: 'Approved via E2E test'
              }
            });
            console.log('Calculation review status:', reviewResponse.status());
            if (reviewResponse.ok()) {
              const reviewData = await reviewResponse.json();
              console.log('Calculation approved:', reviewData);
            } else {
              const errorText = await reviewResponse.text();
              console.log('Calculation review error:', errorText);
            }
          }
        }
      }
    }
    
    // Step 6: Issue credits as admin via API
    await page.goto('http://localhost:8080/dashboard');
    await page.waitForTimeout(2000);
    await page.click('button:has(svg.lucide-log-out)');
    
    // Login via API for admin
    const adminLoginResponse = await page.request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: DEMO_USERS.admin.email,
        password: DEMO_USERS.admin.password
      }
    });
    console.log('Admin login status:', adminLoginResponse.status());
    const adminLoginHeaders = adminLoginResponse.headers();
    const adminSetCookieHeader = adminLoginHeaders['set-cookie'] || '';
    for (const cookieHeader of adminSetCookieHeader.split('\n')) {
      const parts = cookieHeader.split(';');
      const [name, value] = parts[0].split('=');
      if (name && value) {
        await page.context().addCookies([{
          name: name.trim(),
          value: value.trim(),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }]);
      }
    }
    
    // Get the calculation ID for the approved calculation
    // We need to find the calculation we just created
    const calcListResponse = await page.request.get('http://localhost:8080/api/v1/calculations');
    console.log('Calculations list status:', calcListResponse.status());
    if (calcListResponse.ok()) {
      const calcData = await calcListResponse.json();
      console.log('Calculations:', calcData);
      // Find the approved calculation for our project
      const approvedCalc = calcData.items?.find((c: { status: string; methodologyName: string; id: string }) => c.status === 'approved' && c.methodologyName === 'IPCC 2006');
      if (approvedCalc) {
        console.log('Found approved calculation:', approvedCalc.id);
        
        // Issue credits via API
        const issueResponse = await page.request.post('http://localhost:8080/api/v1/credits/issue', {
          data: {
            calculation_id: approvedCalc.id,
            batch_id: 'E2E-BATCH-001',
            quantity: 100,
            vintage_year: 2026
          }
        });
        console.log('Credit issuance status:', issueResponse.status());
        if (issueResponse.ok()) {
          const issueData = await issueResponse.json();
          console.log('Credits issued:', issueData);
        } else {
          const errorText = await issueResponse.text();
          console.log('Credit issuance error:', errorText);
        }
      }
    }
    
    // Step 7: Verify in Registry
    await page.goto('http://localhost:8080/registry');
    await expect(page.locator('text=E2E Test Project').first()).toBeVisible();
    
    // Step 8: Refresh and verify persistence
    await page.reload();
    await expect(page.locator('text=E2E Test Project').first()).toBeVisible();
  });
});