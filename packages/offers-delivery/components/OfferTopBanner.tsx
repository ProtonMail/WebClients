import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { OfferBanner } from './OfferBanner';
import { useActiveOffer } from './useActiveOffer';
import { useOfferUpgrade } from './useOfferUpgrade';

/** Banner-variant offers. Place inside the host's `<TopBanners>` so the `TopBanner` flex-child contract holds. */
export const OfferTopBanner = () => {
    const onUpgrade = useOfferUpgrade(UPSELL_COMPONENT.BANNER);
    const offer = useActiveOffer(CampaignVariant.BANNER, { onUpgrade });

    return offer ? <OfferBanner offer={offer} /> : null;
};
