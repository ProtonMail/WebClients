import type { ComponentPropsWithoutRef } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import useOfferConfig from '../../containers/offers/hooks/useOfferConfig';
import TopNavbarOffer from './TopNavbarOffer';
import { usePostSignupOffers } from './TopNavbarPostSignupPromo/usePostSignupOffers';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    offerProps?: Omit<ComponentPropsWithoutRef<typeof TopNavbarOffer>, 'offerConfig' | 'app'>;
    app: APP_NAMES;
}

const TopNavbarUpsellInner = ({ offerProps, app }: Props) => {
    const [offerConfig, loadingOffer] = useOfferConfig();
    const { loading: loadingPostSignup, eligibleOffer: eligiblePostSignupOffer } = usePostSignupOffers({ app });

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

    if (eligiblePostSignupOffer && !loadingPostSignup) {
        return eligiblePostSignupOffer;
    }

    return <TopNavbarUpgradeButton app={app} />;
};
export default TopNavbarUpsellInner;
