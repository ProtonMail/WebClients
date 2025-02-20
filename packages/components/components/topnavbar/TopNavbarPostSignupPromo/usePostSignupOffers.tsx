import { type ComponentType } from 'react';

import { type APP_NAMES } from '@proton/shared/lib/constants';

import { MailSubscriptionReminder } from './MailSubscriptionReminder/MailSubscriptionReminder';
import { useMailSubscriptionReminder } from './MailSubscriptionReminder/useMailSubscriptionReminder';
import { MailPaidUsersNudge } from './PaidUsersNudge/MailPaidUsersNudge/MailPaidUsersNudge';
import { useMailPaidUsersNudge } from './PaidUsersNudge/MailPaidUsersNudge/useMailPaidUsersNudge';
import { DrivePostSignupOneDollar } from './PostSignupOneDollar/DrivePostSignupOneDollar/DrivePostSignupOneDollar';
import { useDrivePostSignupOneDollar } from './PostSignupOneDollar/DrivePostSignupOneDollar/useDrivePostSignupOneDollar';
import { MailPostSignupOneDollar } from './PostSignupOneDollar/MailPostSignupOneDollar/MailPostSignupOneDollar';
import { useMailPostSignupOneDollar } from './PostSignupOneDollar/MailPostSignupOneDollar/useMailPostSignupOneDollar';
import { type OfferHookReturnValue } from './common/interface';

interface Props {
    app: APP_NAMES;
}

interface Offer extends Pick<OfferHookReturnValue, 'isLoading' | 'isEligible'> {
    Component: ComponentType<any>;
    props?: Record<string, any>;
}

export const usePostSignupOffers = ({ app }: Props) => {
    const mailPostSignup = useMailPostSignupOneDollar();
    const drivePostSignup = useDrivePostSignupOneDollar();
    const mailSubscription = useMailSubscriptionReminder();
    const mailPaidUser = useMailPaidUsersNudge();

    // Define offers in order of priority
    const offers: Offer[] = [
        {
            isEligible: mailPostSignup.isEligible,
            isLoading: mailPostSignup.isLoading,
            Component: MailPostSignupOneDollar,
        },
        {
            isEligible: drivePostSignup.isEligible,
            isLoading: drivePostSignup.isLoading,
            Component: DrivePostSignupOneDollar,
        },
        {
            isEligible: mailSubscription.isEligible,
            isLoading: mailSubscription.isLoading,
            Component: MailSubscriptionReminder,
            props: { app },
        },
        {
            isEligible: mailPaidUser.isEligible,
            isLoading: mailPaidUser.isLoading,
            Component: MailPaidUsersNudge,
        },
    ];

    const eligibleOffer = offers.find((offer) => offer.isEligible && !offer.isLoading);

    return {
        eligibleOffer: eligibleOffer ? <eligibleOffer.Component {...eligibleOffer.props} /> : undefined,
        loading: offers.some((offer) => offer.isLoading),
    };
};
