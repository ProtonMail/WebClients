import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

import ActivityCell from './ActivityCell';
import DateCell from './DateCell';
import RewardCell from './RewardCell';
import UserCell from './UserCell';

interface Props {
    loading?: boolean;
    referrals: Referral[];
    hasReachedRewardLimit: boolean;
}

const RewardsTable = ({ loading, referrals, hasReachedRewardLimit }: Props) => {
    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <Table responsive="cards">
                <TableHeader
                    cells={[c('Label').t`User`, c('Label').t`Date`, c('Label').t`Activity`, c('Label').t`Credits`]}
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
                                    c('Label').t`Credits`,
                                ]}
                                cells={[
                                    <UserCell key={`${referral.ReferralID}-date`} referral={referral} />,
                                    <DateCell key={`${referral.ReferralID}-date`} referral={referral} />,
                                    <ActivityCell key={`${referral.ReferralID}-activity`} referral={referral} />,
                                    <RewardCell
                                        key={`${referral.ReferralID}-reward`}
                                        referral={referral}
                                        hasReachedRewardLimit={hasReachedRewardLimit}
                                    />,
                                ]}
                            />
                        ))}
                    </TableBody>
                )}
            </Table>
        </>
    );
};

export default RewardsTable;
