import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import { getHasCompletedReferral } from '@proton/components/containers/referral/rewards/helpers';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Referral } from '@proton/shared/lib/interfaces';

interface Props {
    referrals: Referral[];
}

export const RewardsCreditDisclaimer = ({ referrals }: Props) => {
    const hasCompletedReferral = getHasCompletedReferral(referrals);

    if (!hasCompletedReferral) {
        return null;
    }
    return (
        <Banner variant="info" className="mb-6">
            {c('Info')
                .t`The referral credit can be awarded up to 2 months after your friend's trial ended, and if your friend subscribed to a plan.`}{' '}
            <Href href={getKnowledgeBaseUrl('/referral-program')}>{c('Link').t`Learn more`}</Href>
        </Banner>
    );
};
