import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    ignorePatterns: ['scripts/**', 'test/**'],
    overrides: [{ files: allGlobs, rules: { 'no-unused-expressions': 'off' } }],
});
