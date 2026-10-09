import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';

import useIsInboxElectronApp from './useIsInboxElectronApp';

const useShowThemeSelection = () => {
    const { isElectron } = useIsInboxElectronApp();
    return isElectron ? hasInboxDesktopFeature('ThemeSelection') : true;
};

export default useShowThemeSelection;
