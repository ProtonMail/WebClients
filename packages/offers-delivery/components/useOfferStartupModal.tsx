import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { StartupModal } from '@proton/components/components/startupModals/types';
import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { OfferDealModal } from './OfferDealModal';
import { type UseActiveOfferOptions, useActiveOffer } from './useActiveOffer';
import { useOfferUpgrade } from './useOfferUpgrade';

interface Options {
    /** For hosts that route `GoToUpsell` their own way (Account). */
    onUpgrade?: UseActiveOfferOptions['onUpgrade'];
}

/** Modal-variant offer as an entry for the host's `StartupModals` list, so it never stacks on another startup modal. */
export const useOfferStartupModal = (options: Options = {}): StartupModal => {
    const [modal, setModal, renderModal] = useModalState();
    const sharedOnUpgrade = useOfferUpgrade(UPSELL_COMPONENT.MODAL);
    const offer = useActiveOffer(CampaignVariant.MODAL, { onUpgrade: options.onUpgrade ?? sharedOnUpgrade });

    return {
        showModal: offer !== null,
        retryUntilIdle: true,
        activateModal: () => setModal(true),
        component: renderModal && offer ? <OfferDealModal offer={offer} {...modal} /> : null,
    };
};
