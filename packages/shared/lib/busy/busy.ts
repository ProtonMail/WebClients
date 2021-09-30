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

export const dropdownRootClassName = 'dropdown';

const textInputSelectors = ['email', 'number', 'password', 'search', 'tel', 'text', 'url'].map(
    (type) => `input[type=${type}]`
);

const allTextInputsSelector = `input:not([type]), textarea, ${textInputSelectors.join(',')}`;

const domIsBusy = () => {
    /*
     * These verifications perform some dom querying operations so in
     * order to not unnecessarily waste performance we return early
     * should any of the conditions fail before evaluationg all of them
     */
    if (document.querySelector(`.${dialogRootClassName}`) !== null) {
        return true;
    }

    if (document.querySelector(`.${dropdownRootClassName}`) !== null) {
        return true;
    }

    const allInputs = document.querySelectorAll<HTMLInputElement>(allTextInputsSelector);

    const allTextInputsAreEmpty = Array.from(allInputs).every((element) => !element.value);

    if (!allTextInputsAreEmpty) {
        return true;
    }

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

const THIRTY_MINUTES = 30 * 60 * 1000;

const isDifferent = (a?: string, b?: string) => !!a && !!b && b !== a;

export const newVersionUpdater = (config: ProtonConfig) => {
    const { VERSION_PATH, COMMIT } = config;

    let reloadTimeoutId: number | null = null;

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
            reloadTimeoutId = null;
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
            window.location.reload();
        }, THIRTY_MINUTES);
    };

    const handleVisibilityChange = () => {
        const documentIsVisible = document.visibilityState === 'visible';

        if (documentIsVisible) {
            clearReload();
            return;
        }

        if (!domIsBusy() && !getIsBusy()) {
            scheduleReload();
        }
    };

    const registerVisibilityChangeListener = () => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    const checkForNewVersion = async () => {
        if (await isNewVersionAvailable()) {
            registerVisibilityChangeListener();
        }
    };

    window.setInterval(
        /*
         * If passed directly, produces eslint error:
         * Promise returned in function argument where a void return was expected (@typescript-eslint)
         */
        () => {
            checkForNewVersion();
        },
        THIRTY_MINUTES
    );
};
