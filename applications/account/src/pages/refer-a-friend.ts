import { c } from 'ttag';

import type { Parameters } from './interface';

// NOTE: This is hardcoded to avoid an import which breaks TypeScript compilation at this stage
const BRAND_NAME = 'Proton';

const url = 'https://account.proton.me/';

const data = (): Parameters => ({
    title: c('Metadata title').t`Enjoy two weeks of ${BRAND_NAME} for free`,
    description: c('Metadata title')
        .t`Experience true online privacy. Protect your data with ${BRAND_NAME} for free for the next 14 days.`,
    ogImage: `${url}assets/refer-a-friend-og-image.jpg`,
});

export default data;
