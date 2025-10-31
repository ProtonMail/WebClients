// import { useCallback, useState } from 'react';
import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import PressEnterToReturn from '../../components/PressEnterToReturn';
import GuestLumoPlusUpsellModal from '../GuestLumoPlusUpsellModal';
import ToggleUpsell from '../primitives/ToggleUpsell';
import useLumoPlusUpsellButtonConfig from '../useLumoPlusUpsellButtonConfig';

const LumoPlusToggle = () => {
    // const [showModal, setShowModal] = useState(false);
    const isGuest = useIsGuest();
    const { canShowLumoUpsellFree } = useLumoPlan();
    const config = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.LUMO_PLUS_UPGRADE_TOGGLE, {
        enableGuestModal: true,
    });

    // Show upsell for guests or free users
    const showUpsell = isGuest || canShowLumoUpsellFree;

    // const handleBackdropAnimationComplete = useCallback(() => {
    //     setShowModal(true);
    // }, []);

    // // Reset modal visibility when modal closes
    // useEffect(() => {
    //     if (!config?.modal?.modalProps.open) {
    //         setShowModal(false);
    //     }
    // }, [config?.modal?.modalProps.open]);

    // const handleToggle = () => {
    //     if (config?.onUpgrade) {
    //         setShowModal(false); // Ensure modal is hidden initially for backdrop animation
    //         config.onUpgrade();
    //     }
    // };

    // Show toggle for guest and free users, otherwise show press enter hint
    if (!showUpsell) {
        return <PressEnterToReturn />;
    }

    return (
        <>
            <ToggleUpsell onUpgrade={config?.onUpgrade} className={config?.className} />
            {/* {config?.modal?.render && (
                <>
                    <LumoPlusBackdropOverlay
                        show={config.modal.modalProps.open}
                        onAnimationComplete={handleBackdropAnimationComplete}
                    />
                    {showModal && (
                        <LumoPlusUpsellModal
                            modalProps={config.modal.modalProps}
                            upsellRef={config.modal.upsellRef}
                            specialBackdrop={false}
                        />
                    )}
                </>
            )} */}
            {config?.guestModal?.render && <GuestLumoPlusUpsellModal {...config.guestModal.modalProps} />}
        </>
    );
};

LumoPlusToggle.displayName = 'LumoComposerToggleUpsell';

export default LumoPlusToggle;
