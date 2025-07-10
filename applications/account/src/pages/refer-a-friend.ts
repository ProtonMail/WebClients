import { c } from 'ttag';

import type { Parameters } from './interface';

// NOTE: This is hardcoded to avoid an import which breaks TypeScript compilation at this stage
const planName = 'Mail Plus';

const data = (): Parameters => ({
    title: c('Metadata title').t`Try ${planName} for free with this link`,
    description: c('Metadata title').t`Private and secure email, no bank card required`,
});

export default data;
