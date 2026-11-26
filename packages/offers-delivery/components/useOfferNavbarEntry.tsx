import type { ReactNode } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcBoltFilled } from '@proton/icons/icons/IcBoltFilled';
import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { OfferDealModal } from './OfferDealModal';
import { OfferNavbarButton } from './OfferNavbarButton';
import { useActiveOffer } from './useActiveOffer';
import { useOfferUpgrade } from './useOfferUpgrade';

export interface OfferNavbarEntry {
    /** `undefined` when there is no offer, so `PrivateHeader`'s `upsellButton` falls back to its default chain. */
    button: ReactNode | undefined;
    modal: ReactNode;
}

export const useOfferNavbarEntry = (): OfferNavbarEntry => {
    const onUpgrade = useOfferUpgrade(UPSELL_COMPONENT.BUTTON);
    const offer = useActiveOffer(CampaignVariant.MODAL, { onUpgrade });
    const [modalProps, setModalOpen, renderModal] = useModalState();

    if (!offer) {
        return { button: undefined, modal: null };
    }

    return {
        button: (
            <OfferNavbarButton
                offer={offer}
                onClick={() => setModalOpen(true)}
                icon={<IcBoltFilled size={5} />}
                backgroundColor="linear-gradient(to right, #fa5c37 0%, #392289 55.288%, #170a31 100%)"
                color="white"
                className="text-uppercase text-bold"
                label={c('Action').t`Special Offer`}
            />
        ),
        modal: renderModal && <OfferDealModal offer={offer} {...modalProps} />,
    };
};
