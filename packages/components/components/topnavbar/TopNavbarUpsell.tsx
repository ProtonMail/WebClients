import { ComponentPropsWithoutRef } from 'react';

import { APP_NAMES } from '@proton/shared/lib/constants';
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
        // We need to ingore the onboarding for the desktop app since we don't mark the welcome flag as done in the app
        return <TopNavbarOffer {...offerProps} offerConfig={offerConfig} app={app} ignoreOnboarding={isElectronApp} />;
    }

    return <TopNavbarUpgradeButton app={app} />;
};

export default TopNavbarUpsell;
