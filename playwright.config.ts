import { defineConfig } from "@playwright/test";
export default defineConfig({testDir:"./tests/e2e",use:{baseURL:process.env.E2E_BASE_URL??"http://localhost:3000",trace:"retain-on-failure"},webServer:process.env.E2E_BASE_URL?undefined:{command:"npx next dev",url:"http://localhost:3000",reuseExistingServer:true,timeout:120000}});
