import MONOREPO_PRETTIER_CONFIG from '../../prettier.config.mjs';

export default {
    ...MONOREPO_PRETTIER_CONFIG,
    printWidth: 120,
    experimentalTernaries: true,
};
