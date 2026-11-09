import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toContainText('Invalid email or password');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Register');
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Register');
  });
});

test.describe('Candidate Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/apply');
  });

  test('should show candidate application form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Submit Your Profile');
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="yearsOfExperience"]')).toBeVisible();
    await expect(page.locator('select[name="remotePreference"]')).toBeVisible();
    await expect(page.locator('select[name="noticePeriod"]')).toBeVisible();
    await expect(page.locator('input[name="salaryExpectation"]')).toBeVisible();
  });

  test('should submit application successfully', async ({ page }) => {
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="yearsOfExperience"]', '5');

    // Add skills
    await page.fill('input[placeholder="Add a skill (press Enter)"]', 'React');
    await page.press('input[placeholder="Add a skill (press Enter)"]', 'Enter');
    await page.fill('input[placeholder="Add a skill (press Enter)"]', 'TypeScript');
    await page.press('input[placeholder="Add a skill (press Enter)"]', 'Enter');

    await page.fill('input[name="location"]', 'San Francisco, CA');
    await page.selectOption('select[name="remotePreference"]', 'REMOTE');
    await page.selectOption('select[name="noticePeriod"]', '30 days');
    await page.fill('input[name="salaryExpectation"]', '150000');

    await page.fill('input[name="resumeUrl"]', 'https://example.com/resume.pdf');
    await page.fill('input[name="linkedinUrl"]', 'https://linkedin.com/in/johndoe');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/apply/success');
    await expect(page.locator('h1')).toContainText('Application Submitted');
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page.locator('text=Location is required')).toBeVisible();
    await expect(page.locator('text=At least one skill is required')).toBeVisible();
    await expect(page.locator('text=Notice period is required')).toBeVisible();
  });
});

test.describe('Recruiter Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Total Candidates')).toBeVisible();
    await expect(page.locator('text=New Applications')).toBeVisible();
    await expect(page.locator('text=Shortlisted')).toBeVisible();
  });

  test('should navigate to candidates list', async ({ page }) => {
    await page.click('text=View All Candidates');
    await expect(page).toHaveURL('/candidates');
    await expect(page.locator('h1')).toContainText('Candidates');
  });

  test('should navigate to candidates from quick actions', async ({ page }) => {
    await page.click('text=Review New');
    await expect(page).toHaveURL(/\/candidates\?status=NEW/);
  });
});

test.describe('Candidates List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/candidates');
  });

  test('should display candidates table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Candidate")')).toBeVisible();
    await expect(page.locator('th:has-text("Exp")')).toBeVisible();
    await expect(page.locator('th:has-text("Skills")')).toBeVisible();
    await expect(page.locator('th:has-text("Location")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should filter candidates by status', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    await page.selectOption('select:has-text("Status")', 'SHORTLISTED');
    await page.click('button:has-text("Clear All")');

    // Wait for filtered results
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('should filter candidates by skills', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    await page.fill('input[placeholder="React, Node, Python"]', 'React');
    await page.click('button:has-text("Clear All")');
  });

  test('should sort candidates', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    await page.selectOption('select:has-text("Sort By")', 'yearsOfExperience');
    await page.selectOption('select:has-text("Order")', 'asc');
  });

  test('should export candidates to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/candidates-\d{4}-\d{2}-\d{2}\.csv/);
  });

  test('should open candidate detail modal', async ({ page }) => {
    await page.click('tbody tr:first-child');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('John Doe');
  });

  test('should change candidate status from dropdown', async ({ page }) => {
    await page.click('tbody tr:first-child [aria-label="Open menu"]');
    await page.click('text=Shortlist');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Yes, update")');
    await expect(page.locator('text=Shortlisted')).toBeVisible();
  });
});

test.describe('Candidate Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/candidates');
    await page.click('tbody tr:first-child');
  });

  test('should display candidate details', async ({ page }) => {
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Contact Information')).toBeVisible();
    await expect(page.locator('text=Experience & Skills')).toBeVisible();
    await expect(page.locator('text=john@example.com')).toBeVisible();
    await expect(page.locator('text=5 years')).toBeVisible();
  });

  test('should show skills as badges', async ({ page }) => {
    await expect(page.locator('text=React')).toBeVisible();
    await expect(page.locator('text=TypeScript')).toBeVisible();
    await expect(page.locator('text=Node.js')).toBeVisible();
  });

  test('should change status from modal', async ({ page }) => {
    await page.click('button:has-text("Shortlist")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should close modal on backdrop click', async ({ page }) => {
    await page.click('[role="dialog"] >> xpath=..');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should close modal on escape key', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/apply');

    await expect(page.locator('h1')).toContainText('Submit Your Profile');
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/apply');
    await expect(page.locator('input[name="fullName"]')).toHaveAttribute('aria-label', 'Full Name');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label', 'Email');
  });

  test('should announce form errors', async ({ page }) => {
    await page.goto('/apply');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});