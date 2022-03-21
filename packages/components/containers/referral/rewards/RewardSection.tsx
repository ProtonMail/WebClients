import { c } from 'ttag';

import { Loader, SettingsSectionWide, Card } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { useReferralInvitesContext } from '../ReferralInvitesContext';
import RewardsProgress from './RewardsProgress';
import RewardsTable from './table/RewardsTable';
import { getDeduplicatedReferrals } from './helpers';

const RewardSection = () => {
    const {
        invitedReferralsState: [invitedReferrals],
        fetchedReferrals: { referrals, total, loading: loadingReferrals },
        fetchedReferralStatus: { rewards, rewardsLimit, loading: loadingRewards },
    } = useReferralInvitesContext();

    const dedupReferrals = getDeduplicatedReferrals(referrals, invitedReferrals);
    const appName = getAppName(APPS.PROTONMAIL);
    const plusPlanName = PLAN_NAMES[PLANS.PLUS];

    const showRewardSection = rewards > 0 || total > 0;
    const reachedRewardLimit = rewards === rewardsLimit && total > 0;

    if (loadingRewards || loadingReferrals) {
        return <Loader />;
    }

    return (
        <SettingsSectionWide>
            {reachedRewardLimit ? (
                <Card className="text-center mb2">
                    <strong>{c('Description')
                        .t`Congratulations! You've earned the maximum of ${rewardsLimit} free months of ${appName} ${plusPlanName}`}</strong>
                    <br />
                    {c('Description').t`You can continue to invite friends, but you wont be able to earn more credits`}
                </Card>
            ) : (
                <p className="color-weak">{c('Description')
                    .t`Track how many people click on your link, sign up, and become paid subscribers. Watch your free months add up.`}</p>
            )}

            {showRewardSection && (
                <div className="border-bottom pb1 mb4">
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

export default RewardSection;
