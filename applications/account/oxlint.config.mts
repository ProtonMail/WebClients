import { createOxlintConfig } from '@proton/oxlint-config';

export default createOxlintConfig({
    restrictedImports: { rollout: ['account-barrel'] },
});
