import { c } from 'ttag';

import { useReferrals } from '@proton/account/referrals/hooks';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import { RewardsCreditDisclaimer } from '@proton/components/containers/referral/rewards/RewardsCreditDisclaimer';

import ReferralsProgress from './RewardsProgress';
import RewardsTable from './table/RewardsTable';

export const RewardSection = () => {
    const [referral, loadingReferral] = useReferrals();

    if (loadingReferral) {
        return <Loader />;
    }

    return (
        <div>
            <DashboardGrid>
                <DashboardGridSectionHeader
                    title={c('Headline').t`Invited friends`}
                    subtitle={c('Description').t`Track the status and activity of your referrals`}
                />
            </DashboardGrid>

            <ReferralsProgress />
            <RewardsCreditDisclaimer referrals={referral.all} />
            <RewardsTable referrals={referral.all} hasReachedRewardLimit={referral.status.hasReachedRewardLimit} />
        </div>
    );
};
