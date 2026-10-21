import { createOxlintConfig } from '@proton/oxlint-config';

export default createOxlintConfig({
    restrictedImports: { rollout: ['account-barrel', 'components-barrel', 'hooks-barrel', 'icon-component'] },
});
