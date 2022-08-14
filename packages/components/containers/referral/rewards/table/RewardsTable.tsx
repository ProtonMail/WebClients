import { c } from 'ttag';

import { Table, TableBody, TableHeader, TableRow } from '@proton/components';
import { Referral, ReferralState } from '@proton/shared/lib/interfaces';

import { Loader } from '../../../../components';
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
            <Table>
                <TableHeader
                    cells={[c('Label').t`User`, c('Label').t`Date`, c('Label').t`Activity`, c('Label').t`Your reward`]}
                />
                {referrals.length > 0 && (
                    <TableBody loading={loading}>
                        {referrals.map((referral) => (
                            <TableRow
                                key={referral.ReferralID}
                                className={[ReferralState.REWARDED].includes(referral.State) ? 'text-bold' : ''}
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
            {referrals.length === 0 && (
                <p className="color-weak">{c('info').t`Track your referral link activities here`}</p>
            )}
        </>
    );
};

export default RewardsTable;
