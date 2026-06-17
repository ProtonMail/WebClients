import React from 'react';

import OfferModal from '@proton/components/containers/offers/components/OfferModal';
import useOfferModal from '@proton/components/containers/offers/hooks/useOfferModal';
import type { OfferConfig } from '@proton/components/containers/offers/interface';

import LumoPlusBackdropOverlay from '../LumoPlusBackdropOverlay';

/**
 * Renders the offer modal. Split into its own module (and lazy-loaded by
 * LumoUpsellModalProvider) so the heavy @proton/components offers/payments UI is only
 * fetched when an offer actually needs to be shown — keeping it off the first-paint
 * (guest/composer) critical path.
 */
const OfferModalRenderer: React.FC<{
    offerConfig: OfferConfig;
    showModal: boolean;
    onClose: () => void;
    specialBackdrop?: boolean;
}> = ({ offerConfig, showModal, onClose, specialBackdrop = true }) => {
    const { offer, renderOfferModal, offerModalProps, setOfferModalOpen, currency, onChangeCurrency, setFetchOffer } =
        useOfferModal(offerConfig);

    React.useEffect(() => {
        if (showModal) {
            // Start fetching immediately when modal should be shown
            setFetchOffer(true);

            if (specialBackdrop) {
                const timer = setTimeout(() => {
                    setOfferModalOpen(true);
                }, 100);
                return () => clearTimeout(timer);
            } else {
                setOfferModalOpen(true);
            }
        } else {
            // Close modal and stop fetching when modal should be hidden
            setOfferModalOpen(false);
            setFetchOffer(false);
        }
    }, [showModal, setOfferModalOpen, setFetchOffer, specialBackdrop]);

    const handleBackdropAnimationComplete = React.useCallback(() => {}, []);

    return (
        <>
            {specialBackdrop && showModal && (
                <LumoPlusBackdropOverlay show={true} onAnimationComplete={handleBackdropAnimationComplete} />
            )}
            {renderOfferModal && offer && (
                <OfferModal
                    currency={currency}
                    onChangeCurrency={onChangeCurrency}
                    offer={{ ...offer, canBeDisabled: false }}
                    offerConfig={offerConfig}
                    modalProps={{
                        ...offerModalProps,
                        onClose: () => {
                            offerModalProps.onClose?.();
                            setFetchOffer(false);
                            onClose(); // Notify parent to close modal
                        },
                    }}
                />
            )}
        </>
    );
};

export default OfferModalRenderer;
