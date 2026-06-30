import { useMemo } from 'react';

import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';
import type { UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { LUMO_PLUS_UPGRADE_PATH, LUMO_SIGNUP_PATH } from '../constants';
import { useLumoPlan } from '../hooks/useLumoPlan';
import { useIsGuest } from '../providers/IsGuestProvider';
import { openLumoUpsellModal, useOfferFlags } from './providers/LumoUpsellModalProvider';

interface UpsellConfigOptions {
    enableGuestModal?: boolean;
}

const useLumoPlusUpsellButtonConfig = (feature: UPSELL_FEATURE, options?: UpsellConfigOptions) => {
    const isGuest = useIsGuest();
    const { canShowLumoUpsellFree, canShowLumoUpsellB2C, canShowLumoUpsellB2B } = useLumoPlan();

    const { hasBlackFridayOffer, hasBlackFridayFreeOffer, loadingOffer } = useOfferFlags();

    const guestModal = useModalStateObject();

    return useMemo(() => {
        if (loadingOffer) {
            return null;
        }

        if (hasBlackFridayOffer) {
            return {
                getChatCTAContent: () => c('collider_2025: Link').t`upgrade to ${LUMO_SHORT_APP_NAME} Plus.`,
                onUpgrade: () => openLumoUpsellModal(feature),
                showInSidebar: hasBlackFridayFreeOffer,
                showInNavbar: hasBlackFridayFreeOffer || !isMobile(),
                showInSettingsModal: true,
                hasBlackFridayOffer: true,
                className: hasBlackFridayFreeOffer
                    ? 'lumo-bf2025-promotion bf2025-available bf-2025-free'
                    : 'lumo-bf2025-promotion bf-2025-paid bf2025-hide-on-mobile',
            };
        }

        if (isGuest) {
            return {
                path: LUMO_SIGNUP_PATH,
                getChatCTAContent: () => c('collider_2025: Link').t`create a free account.`,
                showInSidebar: true,
                showInNavbar: false,
                showInSettingsModal: true,
                onUpgrade: options?.enableGuestModal ? () => guestModal.openModal(true) : undefined,
                // Only return guest modal for components that need it
                guestModal: options?.enableGuestModal
                    ? {
                          render: guestModal.render,
                          modalProps: guestModal.modalProps,
                      }
                    : undefined,
            };
        }

        if (canShowLumoUpsellFree) {
            return {
                getChatCTAContent: () => c('collider_2025: Link').t`upgrade to ${LUMO_SHORT_APP_NAME} Plus.`,
                onUpgrade: () => openLumoUpsellModal(feature),
                showInSidebar: true,
                showInNavbar: true,
                showInSettingsModal: true,
            };
        }

        if (canShowLumoUpsellB2C) {
            return {
                path: LUMO_PLUS_UPGRADE_PATH,
                getChatCTAContent: () => c('collider_2025: Link').t`add ${LUMO_SHORT_APP_NAME} Plus`,
                showInSidebar: true,
                showInNavbar: false,
                showInSettingsModal: false,
            };
        }

        if (canShowLumoUpsellB2B) {
            return {
                path: LUMO_PLUS_UPGRADE_PATH,
                getChatCTAContent: () => c('collider_2025: Link').t`add ${LUMO_SHORT_APP_NAME} Plus`,
                showInSidebar: true,
                showInNavbar: false,
                showInSettingsModal: false,
            };
        }

        return null;
    }, [
        loadingOffer,
        hasBlackFridayOffer,
        hasBlackFridayFreeOffer,
        isGuest,
        canShowLumoUpsellFree,
        canShowLumoUpsellB2C,
        canShowLumoUpsellB2B,
        feature,
        guestModal,
    ]);
};

export default useLumoPlusUpsellButtonConfig;
