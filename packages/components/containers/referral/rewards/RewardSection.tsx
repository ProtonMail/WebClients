import { c } from 'ttag';

import { classnames, Loader, SettingsSectionWide } from '@proton/components';

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

    const showRewardSection = rewards > 0 || total > 0;

    return (
        <SettingsSectionWide>
            <p className="color-weak">{c('Description')
                .t`Track how many people click on your link, sign up, and become paid subscribers. Watch your free months add up.`}</p>

            {loadingRewards ? (
                <Loader />
            ) : (
                <div className={classnames([showRewardSection && 'border-bottom pb1', 'mb4'])}>
                    {showRewardSection ? (
                        <RewardsProgress rewardsLimit={rewardsLimit} rewards={rewards} />
                    ) : (
                        <p className="color-weak">{c('Description').t`Track your referral link activities here.`}</p>
                    )}
                </div>
            )}
            <RewardsTable referrals={dedupReferrals} loading={loadingReferrals} />
        </SettingsSectionWide>
    );
};

export default RewardSection;
