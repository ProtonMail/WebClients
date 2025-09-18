import { useCallback, useEffect, useState } from 'react';

import clsx from 'clsx';
import { c } from 'ttag';

import { Spotlight, Toggle, useModalStateObject } from '@proton/components';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../../constants';
import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import useLumoPlusUpgradeWithTelemetry from '../../../hooks/useLumoPlusUpgradeWithTelemetry';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import LumoPlusLogoInline from '../../components/LumoPlusLogoInline';
import GuestLumoPlusUpsellModal from '../../upsells/GuestLumoPlusUpsellModal';
import LumoPlusBackdropOverlay from '../../upsells/LumoPlusBackdropOverlay';
import LumoPlusUpsellModal from '../../upsells/LumoPlusUpsellModal';

import './LumoPlusToggle.scss';

const LumoPlusToggle = () => {
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const isGuest = useIsGuest();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const guestPlusUpsellModal = useModalStateObject();
    const { isGhostChatMode } = useGhostChat();

    const { upsellRef, openModal, renderModal, modalProps } = useLumoPlusUpgradeWithTelemetry({
        feature: LUMO_UPSELL_PATHS.LUMO_PLUS_UPGRADE_TOGGLE,
        buttonType: 'toggle',
    });

    const handleBackdropAnimationComplete = useCallback(() => {
        setShowModal(true);
    }, []);

    // Reset modal visibility when modal closes
    useEffect(() => {
        if (!modalProps.open) {
            setShowModal(false);
        }
    }, [modalProps.open]);

    const handleToggle = () => {
        if (isGuest) {
            guestPlusUpsellModal.openModal(true);
        } else {
            setShowModal(false); // Ensure modal is hidden initially
            openModal();
        }
    };

    const spotlightContent = (
        <div className="text-sm">
            <LumoPlusLogoInline height="24px" className="mb-2" />
            <p className="m-0 color-weak">
                {c('collider_2025: Info')
                    .t`${LUMO_SHORT_APP_NAME} provide access to advanced models to help with more complex queries and provide better answers`}
            </p>
        </div>
    );

    return (
        <>
            <Spotlight
                show={showSpotlight && !isSmallScreen}
                content={spotlightContent}
                onClose={() => setShowSpotlight(false)}
                originalPlacement="bottom"
                hasClose={false}
                borderRadius="lg"
                className="border-none bg-norm"
            >
                <div
                    onMouseEnter={() => !isSmallScreen && setShowSpotlight(true)}
                    onMouseLeave={() => setShowSpotlight(false)}
                    className="inline-block flex flex-nowrap items-center gap-2"
                >
                    <LumoPlusLogoInline height="16px" />
                    <Toggle
                        id="lumo-plus-toggle"
                        checked={false}
                        onChange={handleToggle}
                        className={clsx('lumo-plus-toggle', LUMO_UPGRADE_TRIGGER_CLASS, {
                            'ghost-mode': isGhostChatMode,
                        })}
                    />
                </div>
            </Spotlight>
            {renderModal && (
                <>
                    <LumoPlusBackdropOverlay
                        show={modalProps.open}
                        onAnimationComplete={handleBackdropAnimationComplete}
                    />
                    {showModal && (
                        <LumoPlusUpsellModal modalProps={modalProps} upsellRef={upsellRef} specialBackdrop={false} />
                    )}
                </>
            )}
            {guestPlusUpsellModal.render && <GuestLumoPlusUpsellModal {...guestPlusUpsellModal.modalProps} />}
        </>
    );
};

export default LumoPlusToggle;
