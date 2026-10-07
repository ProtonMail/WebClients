import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import { useLumoMailTelemetry } from '../telemetry/useLumoMailTelemetry';
import { useLumoHotkey } from './useLumoHotkey';

const LumoDrawerHotkey = () => {
    const { appInView, toggleDrawerApp } = useDrawer();
    const { assistantOpened } = useLumoMailTelemetry();

    useLumoHotkey({
        isCurrentSurfaceOpen: isAppInView(DRAWER_NATIVE_APPS.LUMO, appInView),
        openLumo: () => {
            assistantOpened();
            toggleDrawerApp({ app: DRAWER_NATIVE_APPS.LUMO })();
        },
    });

    return null;
};

export default LumoDrawerHotkey;
