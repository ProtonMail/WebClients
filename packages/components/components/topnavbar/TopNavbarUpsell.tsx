import type { ComponentPropsWithoutRef } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import useOfferConfig from '../../containers/offers/hooks/useOfferConfig';
import TopNavbarOffer from './TopNavbarOffer';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    offerProps?: Omit<ComponentPropsWithoutRef<typeof TopNavbarOffer>, 'offerConfig' | 'app'>;
    app: APP_NAMES;
}

const TopNavbarUpsell = ({ offerProps, app }: Props) => {
    const [offerConfig, loadingOffer] = useOfferConfig();

    if (loadingOffer) {
        return null;
    }

    if (offerConfig) {
        // We need to ignore the onboarding for the desktop app since we don't mark the welcome flag as done in the app
        return <TopNavbarOffer {...offerProps} offerConfig={offerConfig} app={app} ignoreOnboarding={isElectronApp} />;
    }

    return <TopNavbarUpgradeButton app={app} />;
};

export default TopNavbarUpsell;
