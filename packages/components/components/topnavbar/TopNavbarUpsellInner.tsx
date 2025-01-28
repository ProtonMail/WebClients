import type { ComponentPropsWithoutRef } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import useOfferConfig from '../../containers/offers/hooks/useOfferConfig';
import TopNavbarOffer from './TopNavbarOffer';
import { MailSubscriptionReminder } from './TopNavbarPostSignupPromo/MailSubscriptionReminder/MailSubscriptionReminder';
import { useMailSubscriptionReminder } from './TopNavbarPostSignupPromo/MailSubscriptionReminder/useMailSubscriptionReminder';
import { DrivePostSignupOneDollar } from './TopNavbarPostSignupPromo/PostSignupOneDollar/DrivePostSignupOneDollar/DrivePostSignupOneDollar';
import { useDrivePostSignupOneDollar } from './TopNavbarPostSignupPromo/PostSignupOneDollar/DrivePostSignupOneDollar/useDrivePostSignupOneDollar';
import { MailPostSignupOneDollar } from './TopNavbarPostSignupPromo/PostSignupOneDollar/MailPostSignupOneDollar/MailPostSignupOneDollar';
import { useMailPostSignupOneDollar } from './TopNavbarPostSignupPromo/PostSignupOneDollar/MailPostSignupOneDollar/useMailPostSignupOneDollar';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    offerProps?: Omit<ComponentPropsWithoutRef<typeof TopNavbarOffer>, 'offerConfig' | 'app'>;
    app: APP_NAMES;
}

const TopNavbarUpsellInner = ({ offerProps, app }: Props) => {
    const [offerConfig, loadingOffer] = useOfferConfig();
    const { isEligible: isEligibleMailPostSignupOneDollar, loading: loadingMailPostSignup } =
        useMailPostSignupOneDollar();

    const { isEligible: isEligibleMailSubscriptionReminder, loading: loadingSubscriptionReminder } =
        useMailSubscriptionReminder();

    const { isEligible: isEligibleDrivePostSignupOneDollar, loading: loadingDrivePostSignup } =
        useDrivePostSignupOneDollar();

    if (loadingOffer) {
        return null;
    }

    if (offerConfig) {
        // We need to ignore the onboarding for the desktop app since we don't mark the welcome flag as done in the app
        return (
            <TopNavbarOffer
                {...offerProps}
                offerConfig={offerConfig}
                app={app}
                ignoreOnboarding={offerProps?.ignoreOnboarding ?? isElectronApp}
            />
        );
    }

    if (isEligibleMailPostSignupOneDollar && !loadingMailPostSignup) {
        return <MailPostSignupOneDollar />;
    }

    if (isEligibleMailSubscriptionReminder && !loadingSubscriptionReminder) {
        return <MailSubscriptionReminder app={app} />;
    }

    if (isEligibleDrivePostSignupOneDollar && !loadingDrivePostSignup) {
        return <DrivePostSignupOneDollar />;
    }

    return <TopNavbarUpgradeButton app={app} />;
};
export default TopNavbarUpsellInner;
