import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';

import useFlag from '../containers/unleash/useFlag';
import useIsInboxElectronApp from './useIsInboxElectronApp';

const useShowThemeSelection = () => {
    const { isElectron } = useIsInboxElectronApp();
    const inboxDesktopThemeSelectionFlag = useFlag('InboxDesktopThemeSelection');
    return isElectron ? hasInboxDesktopFeature('ThemeSelection') && inboxDesktopThemeSelectionFlag : true;
};

export default useShowThemeSelection;
