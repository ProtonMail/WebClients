import { ComponentPropsWithoutRef } from 'react';

import { APP_NAMES } from '@proton/shared/lib/constants';

import useOfferConfig from '../../containers/offers/hooks/useOfferConfig';
import TopNavbarOffer from './TopNavbarOffer';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    offerProps?: Omit<ComponentPropsWithoutRef<typeof TopNavbarOffer>, 'offerConfig'>;
    app: APP_NAMES;
}

const TopNavbarUpsell = ({ offerProps, app }: Props) => {
    const [offerConfig, loadingOffer] = useOfferConfig();

    if (loadingOffer) {
        return null;
    }

    if (offerConfig) {
        return <TopNavbarOffer {...offerProps} offerConfig={offerConfig} />;
    }

    return <TopNavbarUpgradeButton app={app} />;
};

export default TopNavbarUpsell;
