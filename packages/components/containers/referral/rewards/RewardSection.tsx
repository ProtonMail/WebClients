import { c } from 'ttag';

import { classnames, Loader, SettingsSectionWide } from '@proton/components';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { useReferralInvitesContext } from '../ReferralInvitesContext';
import useReferralRewardStatus from '../hooks/useReferralRewardStatus';
import useReferrals from '../hooks/useReferrals';
import RewardsProgress from './RewardsProgress';
import RewardsTable from './table/RewardsTable';
import { getDeduplicatedReferrals } from './helpers';

const RewardSection = () => {
    const { rewards, rewardsLimit, loading: loadingRewards } = useReferralRewardStatus();
    const { referrals, loading: loadingReferrals, total } = useReferrals();
    const [invitedReferrals] = useReferralInvitesContext();

    const mailAppName = getAppName(APPS.PROTONMAIL);

    const dedupReferrals = getDeduplicatedReferrals(referrals, invitedReferrals);

    const showRewardSection = rewards > 0 || total > 0;

    return (
        <SettingsSectionWide>
            <p className="color-weak">{c('Description')
                .t`Track how many people click on your link, sign up to ${mailAppName}, and become paid subscribers. Watch your free months add up.`}</p>

            {loadingRewards ? (
                <Loader />
            ) : (
                <div className={classnames([showRewardSection && 'border-bottom pb1', 'mb4'])}>
                    {showRewardSection ? (
                        <RewardsProgress rewardsLimit={rewardsLimit} rewards={rewards} />
                    ) : (
                        <p className="color-weak">{c('Description').t`Invite friends to start earning credits`}</p>
                    )}
                </div>
            )}
            <RewardsTable referrals={dedupReferrals} loading={loadingReferrals} />
        </SettingsSectionWide>
    );
};

export default RewardSection;
