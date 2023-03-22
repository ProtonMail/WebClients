import { useActiveBreakpoint, useConfig } from '@proton/components/hooks/index';
import { getDisplayContactsInDrawer } from '@proton/shared/lib/drawer/helpers';

const useDisplayContactsWidget = () => {
    const { isNarrow } = useActiveBreakpoint();
    const { APP_NAME } = useConfig();

    const displayContactsInDrawer = getDisplayContactsInDrawer(APP_NAME);

    // We want to display contacts in the header if window is too small to display Drawer
    return !displayContactsInDrawer || isNarrow;
};

export default useDisplayContactsWidget;
