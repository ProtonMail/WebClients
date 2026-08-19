import { Fragment, type ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useReferrals } from '@proton/account/referrals/hooks';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Price from '@proton/components/components/price/Price';

import moneyGrey from './img/money-grey.svg';
import money from './img/money.svg';
import subscribedGrey from './img/subscribed-grey.svg';
import subscribed from './img/subscribed.svg';
import usersGrey from './img/users-grey.svg';
import users from './img/users.svg';

const StatTitle = ({ children }: { children: ReactNode }) => <div className="h3">{children}</div>;
const StatDescription = ({ children }: { children: ReactNode }) => <div className="color-weak">{children}</div>;

const getStat = (text: string, n: number) => {
    const parts = text.split(`${n}`);

    return parts.map((value, index) =>
        index !== parts.length - 1 ? (
            <Fragment key={index}>
                {value}
                <StatTitle>{n}</StatTitle>
            </Fragment>
        ) : (
            <StatDescription key={index}>{value}</StatDescription>
        )
    );
};

const RewardsProgress = () => {
    const [referral, loadingReferral] = useReferrals();
    const [referralInfo] = useReferralInfo();
    const { maxRewardAmount } = referralInfo.uiData;

    const friendsInvited = referral.total;
    const friendsSubscribed = referral.totalSubscribed;
    const totalEarned = referral.status.rewardAmount;

    const currency = referral.status.currency;

    if (loadingReferral) {
        return null;
    }

    return (
        <DashboardGrid columns={3}>
            <DashboardCard rounded="lg">
                <DashboardCardContent paddingClass="p-3" className="flex justify-space-between flex-nowrap gap-4">
                    <div>
                        {getStat(
                            c('Title').ngettext(
                                msgid`${friendsInvited} Friend invited`,
                                `${friendsInvited} Friends invited`,
                                friendsInvited
                            ),
                            friendsInvited
                        )}
                    </div>
                    <img
                        src={friendsInvited > 0 ? users : usersGrey}
                        alt=""
                        width={48}
                        height={48}
                        className="shrink-0"
                    />
                </DashboardCardContent>
            </DashboardCard>
            <DashboardCard rounded="lg">
                <DashboardCardContent paddingClass="p-3" className="flex justify-space-between flex-nowrap gap-4">
                    <div>
                        {getStat(
                            c('Title').ngettext(
                                msgid`${friendsSubscribed} Friend subscribed`,
                                `${friendsSubscribed} Friends subscribed`,
                                friendsSubscribed
                            ),
                            friendsSubscribed
                        )}
                    </div>
                    <img
                        src={friendsSubscribed > 0 ? subscribed : subscribedGrey}
                        alt=""
                        width={48}
                        height={48}
                        className="shrink-0"
                    />
                </DashboardCardContent>
            </DashboardCard>
            <DashboardCard rounded="lg">
                <DashboardCardContent paddingClass="p-3" className="flex justify-space-between flex-nowrap gap-4">
                    <div>
                        <StatTitle>
                            {<Price currency={currency}>{totalEarned}</Price>}
                            <span className="text-xs color-weak">
                                {' /'}
                                {maxRewardAmount}
                            </span>
                        </StatTitle>
                        <StatDescription>{c('Title').t`Credit earned`}</StatDescription>
                    </div>
                    <img src={totalEarned > 0 ? money : moneyGrey} alt="" width={48} height={48} className="shrink-0" />
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};

export default RewardsProgress;
