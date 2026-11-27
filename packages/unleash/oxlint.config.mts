import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    ignorePatterns: ['testing/mockUnleash.ts', 'testing/mockUseFlag.ts'],
});
