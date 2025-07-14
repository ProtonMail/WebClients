import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';

import { useReferralInvitesContext } from '../ReferralInvitesContext';
import { getDeduplicatedReferrals } from './helpers';
import RewardsTable from './table/RewardsTable';

export const RewardSection = () => {
    const {
        invitedReferralsState: [invitedReferrals],
        fetchedReferrals: { referrals, total, loading: loadingReferrals },
        fetchedReferralStatus: { rewards, rewardsLimit, loading: loadingRewards },
    } = useReferralInvitesContext();

    const dedupReferrals = getDeduplicatedReferrals(referrals, invitedReferrals);

    const reachedRewardLimit = rewards === rewardsLimit && total > 0;

    if (loadingRewards || loadingReferrals) {
        return <Loader />;
    }

    return (
        <SettingsSectionWide>
            <p className="color-weak">{c('Description').t`Track the status and activity of your referrals`}</p>

            <RewardsTable
                referrals={dedupReferrals}
                hasReachedRewardLimit={reachedRewardLimit}
                loading={loadingReferrals}
            />
        </SettingsSectionWide>
    );
};
