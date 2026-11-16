import { format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useReferrals } from '@proton/account/referrals/hooks';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import type { Currency } from '@proton/payments/core/interface';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import { type BusinessReferral, ReferralState } from '@proton/shared/lib/interfaces/Referrals';

import Loader from '../../../components/loader/Loader';
import Price from '../../../components/price/Price';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableHeader from '../../../components/table/TableHeader';
import TableRow from '../../../components/table/TableRow';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import SettingsParagraph from '../../account/SettingsParagraph';
import InviteSendEmail from '../invite/InviteSendEmail';
import InviteShareLink from '../invite/InviteShareLink';
import ActivityCell from '../rewards/table/ActivityCell';
import DateCell from '../rewards/table/DateCell';
import UserCell from '../rewards/table/UserCell';
import noReferrals from '../rewards/table/no-referrals.svg';
import statCredit from './statCredit.svg';
import statInvited from './statInvited.svg';
import statSignedUp from './statSignedUp.svg';
import step1 from './step1.svg';
import step2 from './step2.svg';
import step3 from './step3.svg';

const RewardCell = ({ referral, currency }: { referral: BusinessReferral; currency: Currency }) => {
    if (referral.State === ReferralState.REWARDED && referral.RewardAmount) {
        return (
            <span className="text-semibold color-success">
                + <Price currency={currency}>{referral.RewardAmount}</Price>
            </span>
        );
    }

    if (referral.State === ReferralState.COMPLETED && referral.RewardDueTime) {
        const date = format(fromUnixTime(referral.RewardDueTime), 'MMM d', { locale: dateLocale });
        return <span>{c('Info').t`Expected ${date}`}</span>;
    }

    return <span className="color-weak">{c('Label').t`Pending`}</span>;
};

// Gradient of the line connecting a step icon to the next one: [from, to]
const stepConnectorColors = [
    ['#edb3fe', '#baedff'],
    ['#baedff', '#fee4b9'],
];

const Stat = ({
    title,
    description,
    icon,
    muted,
}: {
    title: React.ReactNode;
    description: string;
    icon: string;
    muted: boolean;
}) => (
    <DashboardCard rounded="lg">
        <DashboardCardContent paddingClass="p-3" className="flex justify-space-between flex-nowrap gap-4">
            <div>
                <div className="h3">{title}</div>
                <div className="color-weak">{description}</div>
            </div>
            <img
                src={icon}
                alt=""
                width={48}
                height={48}
                className="shrink-0"
                style={muted ? { filter: 'grayscale(1)' } : undefined}
            />
        </DashboardCardContent>
    </DashboardCard>
);

export const BusinessReferralSection = () => {
    const [{ business: referrals, status }, loadingReferrals] = useReferrals();
    const [{ b2c2b: referralInfo }, loadingReferralInfo] = useReferralInfo();

    if (loadingReferrals || loadingReferralInfo) {
        return <Loader />;
    }

    const { currency, maxRewardAmount: rewardAmountLimit } = referralInfo;
    const { refereeRewardAmount, referrerRewardAmount, maxRewardAmount } = referralInfo.uiData;
    // Account-wide (consumer and business combined): /referrals/status has no per-program variant and the cap is shared
    const { rewardAmount } = status;
    const invited = referrals.length;
    const signedUp = referrals.filter(({ State }) => State !== ReferralState.INVITED).length;
    const steps = [
        {
            icon: step1,
            text: getBoldFormattedText(
                c('Referral').t`**Share your referral link** with the right person at the company`
            ),
        },
        {
            icon: step2,
            text: getBoldFormattedText(
                c('Referral')
                    .t`**They sign up for a yearly Pro plan** and get an additional ${refereeRewardAmount} off their first year`
            ),
        },
        {
            icon: step3,
            text: getBoldFormattedText(
                c('Referral').t`**You earn ${referrerRewardAmount} for every seat** they add during sign-up.`
            ),
        },
    ];

    return (
        <>
            <SettingsParagraph className="mb-6">
                {c('Description')
                    .t`Refer ${BRAND_NAME} for Business to your network. You earn credits, and they get ${refereeRewardAmount} off a yearly subscription. Earn up to ${maxRewardAmount} in total.`}
            </SettingsParagraph>
            <div className="flex flex-column gap-4 mb-8">
                <h2 className="text-2xl text-bold m-0">{c('Title').t`Why recommend ${BRAND_NAME} for Business?`}</h2>
                <ul className="m-0">
                    <li>{c('Info').t`They get end-to-end encrypted email, storage, and collaboration tools`}</li>
                    <li>{c('Info').t`You earn credits when they sign up`}</li>
                    <li>{c('Info').t`Help an organization protect sensitive data from breaches and surveillance`}</li>
                    <li>{c('Info').t`Support a mission to create a safer internet for everyone`}</li>
                </ul>
            </div>
            <DashboardGrid>
                <DashboardGridSectionHeader title={c('Label').t`Share your invite link`} />
            </DashboardGrid>
            <DashboardGrid columns={3}>
                <div className="flex flex-column gap-x-6 gap-y-4 xl:gap-y-6 grid-col-span-2">
                    <DashboardCard className="h-auto">
                        <DashboardCardContent>
                            <InviteShareLink b2c2b />
                        </DashboardCardContent>
                    </DashboardCard>
                    <DashboardCard className="h-auto">
                        <DashboardCardContent>
                            <InviteSendEmail b2c2b />
                        </DashboardCardContent>
                    </DashboardCard>
                </div>
                <DashboardCard>
                    <DashboardCardContent className="h-full flex flex-column">
                        <h2 className="m-0 mb-4 text-semibold text-lg">{c('Title').t`How it works`}</h2>
                        <ol className="unstyled flex flex-column flex-auto m-0">
                            {steps.map(({ icon, text }, index) => (
                                <li key={icon} className="flex flex-nowrap items-start gap-4 flex-auto">
                                    <div className="flex flex-column items-center self-stretch shrink-0">
                                        <img src={icon} alt="" className="shrink-0" />
                                        {index < steps.length - 1 && (
                                            <div
                                                className="flex-1 w-custom"
                                                style={{
                                                    '--w-custom': '2px',
                                                    minHeight: '1.5rem',
                                                    backgroundImage: `linear-gradient(to bottom, ${stepConnectorColors[index][0]}, ${stepConnectorColors[index][1]})`,
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div>{text}</div>
                                </li>
                            ))}
                        </ol>
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
            <DashboardGrid>
                <DashboardGridSectionHeader
                    title={c('Headline').t`Invited businesses`}
                    subtitle={c('Description').t`Track the status and activity of your referrals`}
                />
            </DashboardGrid>
            <DashboardGrid columns={3}>
                <Stat
                    title={invited}
                    description={c('Title').ngettext(msgid`Business invited`, `Businesses invited`, invited)}
                    icon={statInvited}
                    muted={invited === 0}
                />
                <Stat
                    title={signedUp}
                    description={c('Title').ngettext(msgid`Business signed up`, `Businesses signed up`, signedUp)}
                    icon={statSignedUp}
                    muted={signedUp === 0}
                />
                <Stat
                    title={
                        <>
                            <Price currency={currency}>{rewardAmount}</Price>
                            <span className="text-xs color-weak">
                                {' /'}
                                <Price currency={currency}>{rewardAmountLimit}</Price>
                            </span>
                        </>
                    }
                    description={c('Title').t`Credit earned`}
                    icon={statCredit}
                    muted={rewardAmount === 0}
                />
            </DashboardGrid>
            <DashboardGrid>
                <DashboardCard>
                    <DashboardCardContent>
                        {referrals.length === 0 ? (
                            <div className="flex flex-column items-center gap-2">
                                <img src={noReferrals} alt="" />
                                <div className="text-bold">{c('Info').t`You don't have any referrals.`}</div>
                                <div className="color-weak">
                                    {c('Info').t`Get started with the referral link above.`}
                                </div>
                            </div>
                        ) : (
                            <Table responsive="cards">
                                <TableHeader
                                    cells={[
                                        c('Label').t`Invited via`,
                                        c('Label').t`Date`,
                                        c('Label').t`Activity`,
                                        c('Label').t`Reward`,
                                    ]}
                                />
                                <TableBody>
                                    {referrals.map((referral) => (
                                        <TableRow
                                            key={referral.ReferralID}
                                            className={referral.State === ReferralState.REWARDED ? 'text-bold' : ''}
                                            labels={[
                                                c('Label').t`Invited via`,
                                                c('Label').t`Date`,
                                                c('Label').t`Activity`,
                                                c('Label').t`Reward`,
                                            ]}
                                            cells={[
                                                <UserCell key="user" referral={referral} />,
                                                <DateCell key="date" referral={referral} />,
                                                <ActivityCell key="activity" referral={referral} />,
                                                <RewardCell key="reward" referral={referral} currency={currency} />,
                                            ]}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};
