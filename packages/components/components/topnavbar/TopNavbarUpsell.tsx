import type { ComponentPropsWithoutRef } from 'react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';

import useOfferConfig from '../../containers/offers/hooks/useOfferConfig';
import TopNavbarOffer from './TopNavbarOffer';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    offerProps?: Omit<ComponentPropsWithoutRef<typeof TopNavbarOffer>, 'offerConfig' | 'app'>;
    app: APP_NAMES;
}

const InnerTopNavbarUpsell = ({ offerProps, app }: Props) => {
    const [offerConfig, loadingOffer] = useOfferConfig();

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

    return <TopNavbarUpgradeButton app={app} />;
};

const TopNavbarUpsell = ({ offerProps, app }: Props) => {
    const [userSettings, loadingUserSettings] = useUserSettings();

    if (loadingUserSettings) {
        return null;
    }

    // We only show paid offers if the in-app notification flag is enabled
    if (hasBit(userSettings.News, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS)) {
        return <InnerTopNavbarUpsell offerProps={offerProps} app={app} />;
    }

    // The upgrade button can still be shown (it has its own condition to be shown for free users)
    return <TopNavbarUpgradeButton app={app} />;
};

export default TopNavbarUpsell;
