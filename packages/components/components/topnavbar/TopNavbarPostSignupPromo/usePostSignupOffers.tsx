import { type ComponentType } from 'react';

import { PLANS } from '@proton/payments';
import { type APP_NAMES } from '@proton/shared/lib/constants';

import { AlwaysOnUpsell } from './AlwaysOnUpsell/AlwaysOnUpsell';
import { useAlwaysOnUpsell } from './AlwaysOnUpsell/useAlwaysOnUpsell';
import { GoUnlimited2025 } from './GoUnlimitedOffer/GoUnlimited2025';
import { useGoUnlimited2025 } from './GoUnlimitedOffer/hooks/useGoUnlimited2025';
import { MailSubscriptionReminder } from './MailSubscriptionReminder/MailSubscriptionReminder';
import { useMailSubscriptionReminder } from './MailSubscriptionReminder/useMailSubscriptionReminder';
import { MonthylPaidUsersNudge } from './PaidUsersNudge/MonthylPaidUsersNudge';
import { usePaidUsersNudge } from './PaidUsersNudge/hooks/usePaidUsersNudge';
import { DrivePostSignupOneDollar } from './PostSignupOneDollar/DrivePostSignupOneDollar/DrivePostSignupOneDollar';
import { useDrivePostSignupOneDollar } from './PostSignupOneDollar/DrivePostSignupOneDollar/useDrivePostSignupOneDollar';
import { MailPostSignupOneDollar } from './PostSignupOneDollar/MailPostSignupOneDollar/MailPostSignupOneDollar';
import { useMailPostSignupOneDollar } from './PostSignupOneDollar/MailPostSignupOneDollar/useMailPostSignupOneDollar';
import { type OfferHookReturnValue } from './common/interface';

interface Props {
    app: APP_NAMES;
}

interface Offer extends Pick<OfferHookReturnValue, 'isLoading' | 'isEligible'> {
    id: string;
    Component: ComponentType<any>;
    props?: Record<string, any>;
}

export const usePostSignupOffers = ({ app }: Props) => {
    const mailPostSignup = useMailPostSignupOneDollar();
    const drivePostSignup = useDrivePostSignupOneDollar();
    const alwaysOnUpsell = useAlwaysOnUpsell();

    const mailSubscription = useMailSubscriptionReminder();

    const mailPaidUser = usePaidUsersNudge({ plan: PLANS.MAIL });
    const drivePaidUser = usePaidUsersNudge({ plan: PLANS.DRIVE });
    const bundlePaidUser = usePaidUsersNudge({ plan: PLANS.BUNDLE });

    const goUnlimited2025 = useGoUnlimited2025();

    // Define offers in order of priority
    const offers: Offer[] = [
        {
            id: 'mail-one-dollar-offer',
            isEligible: mailPostSignup.isEligible,
            isLoading: mailPostSignup.isLoading,
            Component: MailPostSignupOneDollar,
        },
        {
            id: 'drive-one-dollar-offer',
            isEligible: drivePostSignup.isEligible,
            isLoading: drivePostSignup.isLoading,
            Component: DrivePostSignupOneDollar,
        },
        {
            id: 'mail-subscription-reminder',
            isEligible: mailSubscription.isEligible,
            isLoading: mailSubscription.isLoading,
            Component: MailSubscriptionReminder,
            props: { app },
        },
        {
            id: 'mail-monthly-nudge',
            isEligible: mailPaidUser.isEligible,
            isLoading: mailPaidUser.isLoading,
            Component: MonthylPaidUsersNudge,
            props: { plan: PLANS.MAIL },
        },
        {
            id: 'drive-monthly-nudge',
            isEligible: drivePaidUser.isEligible,
            isLoading: drivePaidUser.isLoading,
            Component: MonthylPaidUsersNudge,
            props: { plan: PLANS.DRIVE },
        },
        {
            id: 'bundle-monthly-nudge',
            isEligible: bundlePaidUser.isEligible,
            isLoading: bundlePaidUser.isLoading,
            Component: MonthylPaidUsersNudge,
            props: { plan: PLANS.BUNDLE },
        },
        {
            id: 'go-unlimited',
            isEligible: goUnlimited2025.isEligible,
            isLoading: goUnlimited2025.isLoading,
            Component: GoUnlimited2025,
        },
        {
            id: 'always-on-upsell',
            isEligible: alwaysOnUpsell.isEligible,
            isLoading: alwaysOnUpsell.isLoading,
            Component: AlwaysOnUpsell,
            props: { app },
        },
    ];

    const eligibleOffer = offers.find((offer) => offer.isEligible && !offer.isLoading);

    return {
        id: eligibleOffer?.id,
        eligibleOffer: eligibleOffer ? <eligibleOffer.Component {...eligibleOffer.props} /> : undefined,
        loading: offers.some((offer) => offer.isLoading),
    };
};
