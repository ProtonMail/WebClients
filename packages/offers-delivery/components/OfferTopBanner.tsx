import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { OfferBanner } from './OfferBanner';
import { type UseActiveOfferOptions, useActiveOffer } from './useActiveOffer';
import { useOfferUpgrade } from './useOfferUpgrade';

interface Props {
    /** For hosts that route `GoToUpsell` their own way (Account). */
    onUpgrade?: UseActiveOfferOptions['onUpgrade'];
}

/** Banner-variant offers. Place inside the host's `<TopBanners>` so the `TopBanner` flex-child contract holds. */
export const OfferTopBanner = ({ onUpgrade }: Props) => {
    const sharedOnUpgrade = useOfferUpgrade(UPSELL_COMPONENT.BANNER);
    const offer = useActiveOffer(CampaignVariant.BANNER, { onUpgrade: onUpgrade ?? sharedOnUpgrade });

    return offer ? <OfferBanner offer={offer} /> : null;
};
