import { c } from 'ttag';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import { getHasCompletedReferral } from '@proton/components/containers/referral/rewards/helpers';
import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

import ActivityCell from './ActivityCell';
import DateCell from './DateCell';
import RewardCell from './RewardCell';
import UserCell from './UserCell';
import noReferrals from './no-referrals.svg';

interface Props {
    loading?: boolean;
    referrals: Referral[];
    hasReachedRewardLimit: boolean;
}

const RewardsTable = ({ loading, referrals, hasReachedRewardLimit }: Props) => {
    if (referrals.length === 0) {
        return (
            <DashboardGrid>
                <DashboardCard>
                    <DashboardCardContent>
                        <div className="flex flex-column items-center gap-2">
                            <img src={noReferrals} alt="" />
                            <div className="text-bold">{c('Info').t`You don't have any referrals.`}</div>
                            <div className="color-weak">{c('Info').t`Get started with the referral link above.`}</div>
                        </div>
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        );
    }

    const hasCompletedReferral = getHasCompletedReferral(referrals);
    return (
        <DashboardGrid>
            <DashboardCard>
                <DashboardCardContent>
                    <Table responsive="cards">
                        <TableHeader
                            cells={[
                                c('Label').t`User`,
                                c('Label').t`Date`,
                                c('Label').t`Activity`,
                                c('Label').t`Credits`,
                            ]}
                        />
                        {referrals.length > 0 && (
                            <TableBody loading={loading}>
                                {referrals.map((referral) => (
                                    <TableRow
                                        key={referral.ReferralID}
                                        className={[ReferralState.REWARDED].includes(referral.State) ? 'text-bold' : ''}
                                        labels={[
                                            c('Label').t`User`,
                                            c('Label').t`Date`,
                                            c('Label').t`Activity`,
                                            c('Label').t`Reward`,
                                        ]}
                                        cells={[
                                            <UserCell key={`${referral.ReferralID}-date`} referral={referral} />,
                                            <DateCell key={`${referral.ReferralID}-date`} referral={referral} />,
                                            <ActivityCell
                                                key={`${referral.ReferralID}-activity`}
                                                referral={referral}
                                            />,
                                            <RewardCell
                                                key={`${referral.ReferralID}-reward`}
                                                referral={referral}
                                                hasReachedRewardLimit={hasReachedRewardLimit}
                                                hasCompletedReferral={hasCompletedReferral}
                                            />,
                                        ]}
                                    />
                                ))}
                            </TableBody>
                        )}
                    </Table>
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};

export default RewardsTable;
