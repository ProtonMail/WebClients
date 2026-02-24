import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useModalStateWithData } from '@proton/components/components/modalTwo/useModalState';
import OfferModal from '@proton/components/containers/offers/components/OfferModal';
import useOfferModal from '@proton/components/containers/offers/hooks/useOfferModal';
import type { OfferConfig } from '@proton/components/containers/offers/interface';
import useConfig from '@proton/components/hooks/useConfig';
import type { UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import LumoPlusBackdropOverlay from '../LumoPlusBackdropOverlay';
import LumoPlusUpsellModal from '../LumoPlusUpsellModal';
import useGuestSafeOfferConfig from '../hooks/useGuestSafeOfferConfig';

import './OfferModal.scss';

// Optimized context that separates concerns
interface OfferFlagsContextValue {
    hasBlackFridayOffer: boolean;
    hasBlackFridayFreeOffer: boolean;
    hasBlackFridayPaidOffer: boolean;
    loadingOffer: boolean;
}

const OfferFlagsContext = createContext<OfferFlagsContextValue | null>(null);

// Custom event for opening upsell modals
interface OpenLumoUpsellModalEvent extends CustomEvent {
    detail: { feature: UPSELL_FEATURE };
}

interface LumoUpsellModalProviderProps {
    children: React.ReactNode;
}

// Separate component to handle offer modal to avoid calling useOfferModal unnecessarily
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

export const LumoUpsellModalProvider: React.FC<LumoUpsellModalProviderProps> = ({ children }) => {
    const { APP_NAME } = useConfig();
    const [offerConfig, loadingOffer] = useGuestSafeOfferConfig();

    const offerFlags = useMemo(() => {
        const hasBlackFridayFreeOffer = false;
        const hasBlackFridayPaidOffer = false;
        return {
            hasBlackFridayFreeOffer,
            hasBlackFridayPaidOffer,
            hasBlackFridayOffer: hasBlackFridayFreeOffer || hasBlackFridayPaidOffer,
        };
    }, [offerConfig?.ID]);

    const hasOfferConfigRef = useRef(!!offerConfig);
    hasOfferConfigRef.current = !!offerConfig;

    const [showOfferModal, setShowOfferModal] = useState(false);

    const [lumoPlusUpsellModalProps, setLumoPlusUpsellModal, renderLumoPlusUpsellModal] = useModalStateWithData<{
        feature: UPSELL_FEATURE;
        upsellRef: string;
    }>();

    // Listen for custom events to open modals
    useEffect(() => {
        const handleOpenModal = (event: Event) => {
            const customEvent = event as OpenLumoUpsellModalEvent;
            const { feature } = customEvent.detail;

            // If we have an active offer config, show the offer modal instead
            if (hasOfferConfigRef.current) {
                setShowOfferModal(true);
                return;
            }

            // Otherwise show the regular Lumo Plus upsell modal
            const upsellRef =
                getUpsellRefFromApp({
                    app: APP_NAME,
                    feature,
                    component: UPSELL_COMPONENT.BUTTON,
                }) || '';

            setLumoPlusUpsellModal({ feature, upsellRef });
        };

        window.addEventListener('open-lumo-upsell-modal', handleOpenModal);

        return () => {
            window.removeEventListener('open-lumo-upsell-modal', handleOpenModal);
        };
    }, [APP_NAME, setLumoPlusUpsellModal]);

    const offerFlagsContextValue = useMemo<OfferFlagsContextValue>(
        () => ({
            hasBlackFridayOffer: offerFlags.hasBlackFridayOffer,
            hasBlackFridayFreeOffer: offerFlags.hasBlackFridayFreeOffer,
            hasBlackFridayPaidOffer: offerFlags.hasBlackFridayPaidOffer,
            loadingOffer,
        }),
        [
            offerFlags.hasBlackFridayOffer,
            offerFlags.hasBlackFridayFreeOffer,
            offerFlags.hasBlackFridayPaidOffer,
            loadingOffer,
        ]
    );

    return (
        <OfferFlagsContext.Provider value={offerFlagsContextValue}>
            {children}

            {/* Render Lumo Plus upsell modal when no offer is available */}
            {renderLumoPlusUpsellModal && lumoPlusUpsellModalProps.data && (
                <LumoPlusUpsellModal
                    modalProps={lumoPlusUpsellModalProps}
                    upsellRef={lumoPlusUpsellModalProps.data.upsellRef}
                    specialBackdrop
                />
            )}

            {/* Render offer modal when offer config is available */}
            {offerConfig && (
                <OfferModalRenderer
                    offerConfig={offerConfig}
                    showModal={showOfferModal}
                    onClose={() => setShowOfferModal(false)}
                />
            )}
        </OfferFlagsContext.Provider>
    );
};

// Utility function to dispatch modal opening events
export const openLumoUpsellModal = (feature: UPSELL_FEATURE, contextMessage?: string) => {
    window.dispatchEvent(
        new CustomEvent('open-lumo-upsell-modal', {
            detail: { feature, contextMessage },
        })
    );
};

// Hook to consume offer flags from context
export const useOfferFlags = (): OfferFlagsContextValue => {
    const context = useContext(OfferFlagsContext);
    if (!context) {
        throw new Error('useOfferFlags must be used within a LumoUpsellModalProvider');
    }
    return context;
};
