import { test, expect } from '@playwright/test';

test.describe('HillRoadRisk E2E Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the local dev server
    await page.goto('/');
  });

  test('should load the dashboard and verify initial state', async ({ page }) => {
    // Verify document title
    await expect(page).toHaveTitle(/HillRoadRisk — Hyperlocal Landslide/);

    // Verify main header elements
    const headerTitle = page.locator('#app-header h1');
    await expect(headerTitle).toContainText('HillRoadRisk');

    // Sidebar should be open initially
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test('should toggle sidebar view options', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    const toggleBtn = page.locator('#toggle-sidebar-btn');

    // Collapse sidebar
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/collapsed/);

    // Expand sidebar again
    await toggleBtn.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test('should support Day/Night map style changes', async ({ page }) => {
    const themeBtn = page.locator('#theme-toggle-btn');
    
    // Initial theme should be dark (emoji '🌙' or title helper)
    await expect(themeBtn).toContainText('🌙');

    // Click to toggle to light theme
    await themeBtn.click();
    await expect(themeBtn).toContainText('☀️');

    // Verify root class is updated to light-theme
    const rootClass = await page.evaluate(() => document.documentElement.className);
    expect(rootClass).toContain('light-theme');

    // Toggle back to dark theme
    await themeBtn.click();
    await expect(themeBtn).toContainText('🌙');
    const rootClassDark = await page.evaluate(() => document.documentElement.className);
    expect(rootClassDark).not.toContain('light-theme');
  });

  test('should toggle languages from English to Hindi and back', async ({ page }) => {
    const headerTitle = page.locator('#app-header h1');
    const subtitle = page.locator('.header__subtitle');
    const hiBtn = page.locator('#lang-hi-btn');
    const enBtn = page.locator('#lang-en-btn');

    // Click Hindi button
    await hiBtn.click();
    
    // Expect title and subtitle to change to Hindi translation
    await expect(headerTitle).toContainText('हिलरोडरिस्क');
    await expect(subtitle).toContainText('अति-स्थानीय भूस्खलन');

    // Click English button
    await enBtn.click();
    await expect(headerTitle).toContainText('HillRoadRisk');
    await expect(subtitle).toContainText('Hyperlocal Landslide Risk');
  });

  test('should allow interacting with map filters', async ({ page }) => {
    const districtSelect = page.locator('#filter-district');
    const susceptibilitySelect = page.locator('#filter-susceptibility');
    const highwaySelect = page.locator('#filter-highway');
    const resetFiltersBtn = page.locator('#reset-filters');

    // Choose Chamoli district
    await districtSelect.selectOption('Chamoli');
    await expect(districtSelect).toHaveValue('Chamoli');

    // Choose High susceptibility
    await susceptibilitySelect.selectOption('High');
    await expect(susceptibilitySelect).toHaveValue('High');

    // Choose NH highway class
    await highwaySelect.selectOption('NH');
    await expect(highwaySelect).toHaveValue('NH');

    // Click Reset
    await resetFiltersBtn.click();
    await expect(districtSelect).toHaveValue('');
    await expect(susceptibilitySelect).toHaveValue('');
    await expect(highwaySelect).toHaveValue('');
  });
});
