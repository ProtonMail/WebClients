import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    overrides: [{ files: ['src/getSafeErrorObject.ts'], rules: { 'no-use-before-define': 'off' } }],
});
