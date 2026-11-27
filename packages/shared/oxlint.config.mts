import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    ignorePatterns: ['tests/**/*data.js'],
});
