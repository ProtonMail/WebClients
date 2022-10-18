import useOfferConfig from '../../containers/offers/hooks/useOfferConfig';
import TopNavbarOffer from './TopNavbarOffer';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

const TopNavbarUpsell = () => {
    const [offerConfig, loadingOffer] = useOfferConfig();

    if (loadingOffer) {
        return null;
    }

    if (offerConfig) {
        return <TopNavbarOffer offerConfig={offerConfig} />;
    }

    return <TopNavbarUpgradeButton />;
};

export default TopNavbarUpsell;
