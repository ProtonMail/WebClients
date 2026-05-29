import { c } from 'ttag';

import type { Parameters } from './interface';

// NOTE: This is hardcoded to avoid an import which breaks TypeScript compilation at this stage
const BRAND_NAME = 'Proton';
const refereeRewardAmount = 'US$20';

const url = 'https://account.proton.me/';

const data = (): Parameters => ({
    title: c('Metadata title').t`Join ${BRAND_NAME} and get ${refereeRewardAmount} in credits`,
    description: c('Metadata title')
        .t`Experience true online privacy with a secure email, cloud storage, password manager, and VPN. Join ${BRAND_NAME} today and get ${refereeRewardAmount} off your next subscription.`,
    ogImage: `${url}assets/refer-a-friend-og-image.jpg`,
});

export default data;
