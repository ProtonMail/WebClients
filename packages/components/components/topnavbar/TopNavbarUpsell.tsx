import { useOfferConfig } from '@proton/components';

import TopNavbarOffer from './TopNavbarOffer';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

const TopNavbarUpsell = () => {
    const offerConfig = useOfferConfig();

    if (offerConfig) {
        return <TopNavbarOffer offerConfig={offerConfig} />;
    }

    return <TopNavbarUpgradeButton />;
};

export default TopNavbarUpsell;
