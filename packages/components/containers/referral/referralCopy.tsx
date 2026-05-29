import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export const getReferralStep1Copy = () =>
    getBoldFormattedText(c('Info').t`**Invite your friends** to ${BRAND_NAME} with your referral link.`);

export const getReferralStep2Copy = (refereeRewardAmount: string) =>
    getBoldFormattedText(c('Info').t`**They get ${refereeRewardAmount}** in credits if they subscribe.`);

export const getReferralStep3Copy = (referrerRewardAmount: string) =>
    getBoldFormattedText(c('Info').t`**You get ${referrerRewardAmount}** in credits for every friend that subscribes.`);

export const getReferralMaxRewardCopy = (maxRewardAmount: string) =>
    getBoldFormattedText(c('Referral').t`You can get up to **${maxRewardAmount}** in credit.`);
