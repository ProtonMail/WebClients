import { OfferBanner } from '@proton/offers-delivery/components/OfferBanner';
import { useActiveOffer } from '@proton/offers-delivery/components/useActiveOffer';
import { CampaignVariant } from '@proton/offers-delivery/interface';

import { useOfferUpgrade } from './useOfferUpgrade';

/** Banner-variant offers, placed inside the app's top-banner stack so the
 * `TopBanner` flex-child contract holds. */
const AccountOfferTopBanner = () => {
    const onUpgrade = useOfferUpgrade();
    const offer = useActiveOffer(CampaignVariant.BANNER, { onUpgrade });

    if (!offer) {
        return null;
    }

    return <OfferBanner offer={offer} />;
};

export default AccountOfferTopBanner;
