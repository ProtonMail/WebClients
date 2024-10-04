import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useConfig from '@proton/components/hooks/useConfig';
import { getDisplayContactsInDrawer } from '@proton/shared/lib/drawer/helpers';

const useDisplayContactsWidget = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const { APP_NAME } = useConfig();

    const displayContactsInDrawer = getDisplayContactsInDrawer(APP_NAME);

    // We want to display contacts in the header if window is too small to display Drawer
    return !displayContactsInDrawer || viewportWidth['<=small'];
};

export default useDisplayContactsWidget;
