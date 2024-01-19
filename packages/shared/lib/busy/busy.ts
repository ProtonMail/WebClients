import noop from '@proton/utils/noop';

import { isElectronApp } from '../helpers/desktop';
import { traceError } from '../helpers/sentry';
import { ProtonConfig } from '../interfaces';

let uid = 0;
let busies = [] as number[];

const unregister = (id: number) => {
    busies = busies.filter((busy) => busy !== id);
};

const register = () => {
    const id = uid++;

    busies.push(id);

    return () => {
        unregister(id);
    };
};

const getIsBusy = () => {
    return busies.length > 0;
};

export default {
    unregister,
    register,
    getIsBusy,
};

export const dialogRootClassName = 'modal-container';

export const modalTwoRootClassName = 'modal-two';
export const modalTwoBackdropRootClassName = 'modal-two-backdrop';

export const dropdownRootClassName = 'dropdown';

const textInputSelectors = ['email', 'number', 'password', 'search', 'tel', 'text', 'url'].map(
    (type) => `input[type=${type}]`
);

const allTextInputsSelector = `input:not([type]), textarea, ${textInputSelectors.join(',')}`;

export const isDialogOpen = () => document.querySelector(`.${dialogRootClassName}, [role="dialog"]`) !== null;
export const isModalOpen = () => document.querySelector(`.${modalTwoRootClassName}`) !== null;
export const isModalBackdropOpen = () => document.querySelector(`.${modalTwoBackdropRootClassName}`) !== null;
export const isDropdownOpen = () => document.querySelector(`.${dropdownRootClassName}`) !== null;

export const isEditing = () => {
    const { activeElement } = document;

    if (activeElement === null) {
        return false;
    }

    if (
        (activeElement.closest('form') ||
            activeElement.closest('iframe') ||
            activeElement.closest('[contenteditable]')) !== null
    ) {
        return true;
    }

    return false;
};

export const domIsBusy = () => {
    /*
     * These verifications perform some dom querying operations so in
     * order to not unnecessarily waste performance we return early
     * should any of the conditions fail before evaluating all of them
     */
    if (isDialogOpen()) {
        return true;
    }

    if (isModalOpen()) {
        return true;
    }

    if (isDropdownOpen()) {
        return true;
    }

    const allInputs = document.querySelectorAll<HTMLInputElement>(allTextInputsSelector);

    const allTextInputsAreEmpty = Array.from(allInputs).every((element) => !element.value);

    if (!allTextInputsAreEmpty) {
        return true;
    }

    return isEditing();
};

const THIRTY_MINUTES = 30 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

const isDifferent = (a?: string, b?: string) => !!a && !!b && b !== a;

export const newVersionUpdater = (config: ProtonConfig) => {
    const { VERSION_PATH, COMMIT } = config;

    let reloadTimeoutId: number | null = null;
    let versionIntervalId: number | null = null;
    let electronFocusTimeoutId: number | null = null;

    const getVersion = () => fetch(VERSION_PATH).then((response) => response.json());

    const isNewVersionAvailable = async () => {
        try {
            const { commit } = await getVersion();

            return isDifferent(commit, COMMIT);
        } catch (error: any) {
            traceError(error);
        }
    };

    const clearReload = () => {
        if (reloadTimeoutId) {
            window.clearTimeout(reloadTimeoutId);
            reloadTimeoutId = null;
        }

        if (electronFocusTimeoutId) {
            window.clearTimeout(electronFocusTimeoutId);
            electronFocusTimeoutId = null;
        }
    };

    const clearVersionCheck = () => {
        if (versionIntervalId) {
            window.clearInterval(versionIntervalId);
            versionIntervalId = null;
        }
    };

    /*
     * Instead of immediately reloading as soon as we detect the user to
     * not be busy and also having left the tab / browser / window, we
     * schedule a reload in case the user only left for a little while
     * and is about to come back soon.
     */
    const scheduleReload = () => {
        clearReload();
        reloadTimeoutId = window.setTimeout(() => {
            // If the user turns out to be busy here for some reason, abort the reload, and await a new visibilitychange event
            // In the case of the electron app, we also check if the app is focused, we abort reloading if that's the case
            if (domIsBusy() || getIsBusy() || document.hasFocus()) {
                return;
            }
            window.location.reload();
        }, THIRTY_MINUTES);
    };

    const handleVisibilityChange = () => {
        const documentIsVisible = document.visibilityState === 'visible';

        if (documentIsVisible) {
            clearReload();
            return;
        }

        if (domIsBusy() || getIsBusy()) {
            return;
        }

        scheduleReload();
    };

    const registerVisibilityChangeListener = () => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    // The 'visibilitychange' event is different on Electron and only triggered when the app is completely hidden
    // This happens when the reduce the app in the dock or switch to a full screen application
    // To mitigate this we set a 5 minute timeout that checks if the app is not focused, if that's the case we schedule a reload
    const handleElectronFocus = () => {
        electronFocusTimeoutId = window.setTimeout(() => {
            if (!document.hasFocus()) {
                scheduleReload();
            }
        }, FIVE_MINUTES);
    };

    const checkForNewVersion = async () => {
        if (await isNewVersionAvailable()) {
            clearVersionCheck();
            if (isElectronApp()) {
                handleElectronFocus();
            } else {
                registerVisibilityChangeListener();
            }
        }
    };

    versionIntervalId = window.setInterval(() => {
        checkForNewVersion().catch(noop);
    }, THIRTY_MINUTES);
};
