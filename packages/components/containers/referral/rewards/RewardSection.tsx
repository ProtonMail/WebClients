import { c } from 'ttag';

import { useReferrals } from '@proton/account/referrals/hooks';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { RewardsCreditDisclaimer } from '@proton/components/containers/referral/rewards/RewardsCreditDisclaimer';

import ReferralsProgress from './RewardsProgress';
import RewardsTable from './table/RewardsTable';

export const RewardSection = () => {
    const [referral, loadingReferral] = useReferrals();

    if (loadingReferral) {
        return <Loader />;
    }

    return (
        <SettingsSectionWide>
            <p className="color-weak">{c('Description').t`Track the status and activity of your referrals`}</p>

            <ReferralsProgress />
            <RewardsCreditDisclaimer referrals={referral.all} />
            <RewardsTable referrals={referral.all} hasReachedRewardLimit={referral.status.hasReachedRewardLimit} />
        </SettingsSectionWide>
    );
};
