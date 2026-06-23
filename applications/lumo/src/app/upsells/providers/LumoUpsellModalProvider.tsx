import React, { Suspense, createContext, lazy, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useModalStateWithData } from '@proton/components/components/modalTwo/useModalState';
import useConfig from '@proton/components/hooks/useConfig';
import type { UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import useGuestSafeOfferConfig from '../hooks/useGuestSafeOfferConfig';

import './OfferModal.scss';

// The upsell/offer modals pull the heavy @proton/components payments + offers UI
// (subscription modal, plans, offer modal — ~payments stack). They only ever render after
// a user action (clicking upgrade) or when an offer is available, so lazy-load them to keep
// that UI off the first-paint (guest/composer) critical path.
const LumoPlusUpsellModal = lazy(() => import('../LumoPlusUpsellModal'));
const OfferModalRenderer = lazy(() => import('./OfferModalRenderer'));

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

export const LumoUpsellModalProvider: React.FC<LumoUpsellModalProviderProps> = ({ children }) => {
    const { APP_NAME } = useConfig();
    const { config: offerConfig, isLoading: loadingOffer } = useGuestSafeOfferConfig();

    const offerFlags = useMemo(() => {
        const hasBlackFridayFreeOffer = false; // Keeping for backward compatibility
        const hasBlackFridayPaidOffer = false; // Keeping for backward compatibility

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
                <Suspense fallback={null}>
                    <LumoPlusUpsellModal
                        modalProps={lumoPlusUpsellModalProps}
                        upsellRef={lumoPlusUpsellModalProps.data.upsellRef}
                        specialBackdrop
                    />
                </Suspense>
            )}

            {offerConfig && (
                <Suspense fallback={null}>
                    <OfferModalRenderer
                        offerConfig={offerConfig}
                        showModal={showOfferModal}
                        onClose={() => setShowOfferModal(false)}
                    />
                </Suspense>
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
