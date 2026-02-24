import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import PressEnterToReturn from '../../components/Composer/PressEnterToReturn';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useIsGuest } from '../../providers/IsGuestProvider';
import GuestLumoPlusUpsellModal from '../GuestLumoPlusUpsellModal';
import ToggleUpsell from '../primitives/ToggleUpsell';
import useLumoPlusUpsellButtonConfig from '../useLumoPlusUpsellButtonConfig';

const LumoPlusToggle = () => {
    const isGuest = useIsGuest();
    const { canShowLumoUpsellFree } = useLumoPlan();
    const config = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.LUMO_PLUS_UPGRADE_TOGGLE, {
        enableGuestModal: true,
    });

    // Show upsell for guests or free users
    const showUpsell = isGuest || canShowLumoUpsellFree;

    if (!showUpsell) {
        return <PressEnterToReturn />;
    }

    return (
        <>
            <ToggleUpsell onUpgrade={config?.onUpgrade} className={config?.className} />
            {config?.guestModal?.render && <GuestLumoPlusUpsellModal {...config.guestModal.modalProps} />}
        </>
    );
};

LumoPlusToggle.displayName = 'LumoComposerToggleUpsell';

export default LumoPlusToggle;
