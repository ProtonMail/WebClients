import { FeatureCode } from '@proton/components/containers';
import { useActiveBreakpoint, useConfig, useFeature } from '@proton/components/hooks/index';
import { getDisplayContactsInDrawer } from '@proton/shared/lib/drawer/helpers';
import { DrawerFeatureFlag } from '@proton/shared/lib/interfaces/Drawer';

const useDisplayContactsWidget = () => {
    const { feature: drawerFeature } = useFeature<DrawerFeatureFlag>(FeatureCode.Drawer);
    const { isNarrow } = useActiveBreakpoint();
    const { APP_NAME } = useConfig();

    const displayContactsInDrawer = getDisplayContactsInDrawer(APP_NAME, drawerFeature);

    // We want to display contacts in the header if
    // Feature flag is OFF
    // Feature flag is ON but window is too small to display Drawer
    const displayContactsInHeader = !displayContactsInDrawer || isNarrow;

    return displayContactsInHeader;
};

export default useDisplayContactsWidget;
