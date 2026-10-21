import { createOxlintConfig } from '@proton/oxlint-config';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    ignorePatterns: ['scripts/**', 'test/**'],
    overrides: [{ files: allGlobs, rules: { 'no-unused-expressions': 'off' } }],
});
