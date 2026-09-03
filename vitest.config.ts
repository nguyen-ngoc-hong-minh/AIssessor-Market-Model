import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({test:{environment:"jsdom",include:["tests/**/*.test.ts","tests/**/*.test.tsx"],exclude:["tests/e2e/**"],setupFiles:["./tests/setup.ts"],coverage:{provider:"v8",reporter:["text","json-summary"]}},resolve:{alias:{"@":path.resolve(__dirname,".")}}});
