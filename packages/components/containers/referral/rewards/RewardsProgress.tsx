import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { useReferrals } from '@proton/account/referrals/hooks';
import Price from '@proton/components/components/price/Price';
import clsx from '@proton/utils/clsx';

import moneyGrey from './img/money-grey.svg';
import money from './img/money.svg';
import subscribedGrey from './img/subscribed-grey.svg';
import subscribed from './img/subscribed.svg';
import usersGrey from './img/users-grey.svg';
import users from './img/users.svg';

const StatTitle = ({ children }: { children: ReactNode }) => <div className="h3">{children}</div>;
const StatDescription = ({ children }: { children: ReactNode }) => <div className="color-weak">{children}</div>;

const getStat = (text: string, n: number) => {
    return text
        .split(`${n}`)
        .map((value, index, arr) =>
            index !== arr.length - 1
                ? [value, <StatTitle>{n}</StatTitle>]
                : [<StatDescription>{value}</StatDescription>]
        );
};

const RewardsProgress = () => {
    const [referral, loadingReferral] = useReferrals();

    const friendsInvited = referral.total;
    const friendsSubscribed = referral.totalSubscribed;
    const totalEarned = referral.status.rewardAmount;

    const currency = referral.status.currency;

    if (loadingReferral) {
        return null;
    }

    const borderedBoxClasses = 'border border-weak rounded p-4';

    return (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
            <div className={clsx(borderedBoxClasses, 'flex-1 flex justify-space-between flex-nowrap gap-4')}>
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
                <img src={friendsInvited > 0 ? users : usersGrey} alt="" width={48} height={48} className="shrink-0" />
            </div>
            <div className={clsx(borderedBoxClasses, 'flex-1 flex justify-space-between flex-nowrap gap-4')}>
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
            </div>
            <div className={clsx(borderedBoxClasses, 'flex-1 flex justify-space-between flex-nowrap gap-4')}>
                <div>
                    <StatTitle>{<Price currency={currency}>{totalEarned}</Price>}</StatTitle>
                    <StatDescription>{c('Title').t`Credit earned`}</StatDescription>
                </div>
                <img src={totalEarned > 0 ? money : moneyGrey} alt="" width={48} height={48} className="shrink-0" />
            </div>
        </div>
    );
};

export default RewardsProgress;
