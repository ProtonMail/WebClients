import { defineConfig } from 'oxlint';

import { localOverlay } from './packages/oxlint-config/src/localOverlay.ts';

/**
 * Fallback for workspaces that have no oxlint.config.mts yet (still on ESLint). It holds no team rules, only the
 * optional personal rules from oxlint.local.mts, so it is empty unless an engineer opted in.
 */
export default defineConfig({
    categories: { correctness: 'off' },
    ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/.*/', '**/coverage/**', '**/__snapshots__/**'],
    jsPlugins: localOverlay?.jsPlugins,
    rules: localOverlay?.rules,
});
