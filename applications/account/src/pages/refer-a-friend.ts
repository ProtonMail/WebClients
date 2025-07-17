import { c } from 'ttag';

import type { Parameters } from './interface';

// NOTE: This is hardcoded to avoid an import which breaks TypeScript compilation at this stage
const BRAND_NAME = 'Proton';

const data = (): Parameters => ({
    title: c('Metadata title').t`Try ${BRAND_NAME} for free with this link`,
    description: c('Metadata title').t`Take control of your data with end-to-end encryption. No bank card required.`,
});

export default data;
