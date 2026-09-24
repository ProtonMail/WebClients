import LumoDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/LumoDrawerAppButton';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import { useLumoMailTelemetry } from '../../lumo/telemetry/useLumoMailTelemetry';

/** A step larger than the neighbouring settings cog, to draw the eye to the assistant. */
const LumoHeaderButton = () => {
    const { appInView } = useDrawer();
    const { assistantOpened } = useLumoMailTelemetry();
    const isOpen = isAppInView(DRAWER_NATIVE_APPS.LUMO, appInView);

    return (
        <LumoDrawerAppButton
            logoSize={6}
            tooltipPlacement="bottom"
            aria-expanded={isOpen}
            onClick={isOpen ? undefined : assistantOpened}
        />
    );
};

export default LumoHeaderButton;
