import { c } from 'ttag';

import { Card } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { useReferralInvitesContext } from '../ReferralInvitesContext';
import RewardsProgress from './RewardsProgress';
import { getDeduplicatedReferrals } from './helpers';
import RewardsTable from './table/RewardsTable';

export const RewardSection = () => {
    const {
        invitedReferralsState: [invitedReferrals],
        fetchedReferrals: { referrals, total, loading: loadingReferrals },
        fetchedReferralStatus: { rewards, rewardsLimit, loading: loadingRewards },
    } = useReferralInvitesContext();

    const dedupReferrals = getDeduplicatedReferrals(referrals, invitedReferrals);
    const plusPlanName = PLAN_NAMES[PLANS.MAIL];

    const showRewardSection = rewards > 0 || total > 0;
    const reachedRewardLimit = rewards === rewardsLimit && total > 0;

    if (loadingRewards || loadingReferrals) {
        return <Loader />;
    }

    return (
        <SettingsSectionWide>
            {reachedRewardLimit ? (
                <Card rounded className="text-center mb-8">
                    <strong>{c('Description')
                        .t`Congratulations! You've earned the maximum of ${rewardsLimit} free months of ${plusPlanName}.`}</strong>
                    <br />
                    {c('Description').t`You can continue to invite friends, but you wont be able to earn more credits`}
                </Card>
            ) : (
                <p className="color-weak">{c('Description').t`Track the status and activity of your referrals.`}</p>
            )}

            {showRewardSection && (
                <div className="border-bottom pb-4 mb-14">
                    <RewardsProgress rewardsLimit={rewardsLimit} rewards={rewards} />
                </div>
            )}
            <RewardsTable
                referrals={dedupReferrals}
                hasReachedRewardLimit={reachedRewardLimit}
                loading={loadingReferrals}
            />
        </SettingsSectionWide>
    );
};
