import { getInboxDesktopUserInfo, hasInboxDesktopFeature, invokeInboxDesktopIPC } from './ipcHelpers';

export const storeESUserChoiceInboxDesktop = (userID: string, userChoice: boolean) => {
    if (!hasInboxDesktopFeature('ESUserChoice')) {
        return;
    }

    invokeInboxDesktopIPC({ type: 'setESUserChoice', payload: { userID, userChoice } });
};

// isESEnabledUserChoiceInboxDesktop must return `true` if:
// - currently not running in destkop app
// - desktop app doesn't have the feature
// - no user-choice was done
// Otherwise return stored value
export const isESEnabledUserChoiceInboxDesktop = (userID: string): boolean => {
    if (!hasInboxDesktopFeature('ESUserChoice')) {
        return true;
    }

    const userChoice = getInboxDesktopUserInfo('esUserChoice', userID);

    if (userChoice === null) {
        return true;
    }

    return userChoice;
};
