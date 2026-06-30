import { defineConfig } from '/home/papajittan/Documents/node_modules/playwright/test.mjs';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  timeout: 20000,
  use: {
    baseURL: 'http://127.0.0.1:5500',
  },
  webServer: {
    command: 'python3 -m http.server 5500 --directory /home/papajittan/Documents/Tamroi',
    url: 'http://127.0.0.1:5500',
    reuseExistingServer: true,
    timeout: 10000,
  },
});
