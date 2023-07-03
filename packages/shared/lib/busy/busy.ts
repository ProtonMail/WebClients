import noop from '@proton/utils/noop';

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
     * should any of the conditions fail before evaluationg all of them
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

const isDifferent = (a?: string, b?: string) => !!a && !!b && b !== a;

export const newVersionUpdater = (config: ProtonConfig) => {
    const { VERSION_PATH, COMMIT } = config;

    let reloadTimeoutId: number | null = null;
    let versionIntervalId: number | null = null;

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
            if (domIsBusy() || getIsBusy()) {
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

    const checkForNewVersion = async () => {
        if (await isNewVersionAvailable()) {
            clearVersionCheck();
            registerVisibilityChangeListener();
        }
    };

    versionIntervalId = window.setInterval(() => {
        checkForNewVersion().catch(noop);
    }, THIRTY_MINUTES);
};
