import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { StartupModal } from '@proton/components/components/startupModals/types';
import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { OfferDealModal } from './OfferDealModal';
import { useActiveOffer } from './useActiveOffer';
import { useOfferUpgrade } from './useOfferUpgrade';

/** Modal-variant offer as an entry for the host's `StartupModals` list, so it never stacks on another startup modal. */
export const useOfferStartupModal = (): StartupModal => {
    const [modal, setModal, renderModal] = useModalState();
    const onUpgrade = useOfferUpgrade(UPSELL_COMPONENT.MODAL);
    const offer = useActiveOffer(CampaignVariant.MODAL, { onUpgrade });

    return {
        showModal: offer !== null,
        retryUntilIdle: true,
        activateModal: () => setModal(true),
        component: renderModal && offer ? <OfferDealModal offer={offer} {...modal} /> : null,
    };
};
