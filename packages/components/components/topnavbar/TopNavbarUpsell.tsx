import { ComponentPropsWithoutRef } from 'react';

import useOfferConfig from '../../containers/offers/hooks/useOfferConfig';
import TopNavbarOffer from './TopNavbarOffer';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    offerProps?: Omit<ComponentPropsWithoutRef<typeof TopNavbarOffer>, 'offerConfig'>;
}

const TopNavbarUpsell = ({ offerProps }: Props) => {
    const [offerConfig, loadingOffer] = useOfferConfig();

    if (loadingOffer) {
        return null;
    }

    if (offerConfig) {
        return <TopNavbarOffer {...offerProps} offerConfig={offerConfig} />;
    }

    return <TopNavbarUpgradeButton />;
};

export default TopNavbarUpsell;
