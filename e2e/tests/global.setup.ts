import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // In a real application, navigate to login page, perform login,
  // wait for successful auth, then save storageState.
  // For bootstrapping, we write a placeholder auth state.
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
