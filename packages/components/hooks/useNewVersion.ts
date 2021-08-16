import { useEffect } from 'react';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { ProtonConfig } from '@proton/shared/lib/interfaces';

import { dialogRootClassName, dropdownRootClassName } from '../components';

const versionInterface = {
    subscriber: null as null | Function,

    subscribe(subscriber: Function) {
        this.subscriber = subscriber;

        return () => {
            this.subscriber = null;
        };
    },

    fakeNewVersionAvailable() {
        this.subscriber?.();
    },
};

(window as any).versionInterface = versionInterface;

const EVERY_THIRTY_MINUTES = 30 * 60 * 1000;

const isDifferent = (a?: string, b?: string) => !!a && !!b && b !== a;

const userIsBusy = () => {
    /*
     * These verifications perform some dom querying operations so in
     * order to not unnecessarily waste performance we return early
     * should any of the conditions fail before evaluationg all of them
     */
    if (document.querySelector(`.${dialogRootClassName}`) !== null) {
        console.log('true, dialog open');
        return true;
    }

    if (document.querySelector(`.${dropdownRootClassName}`) !== null) {
        console.log('true, dropdown open');
        return true;
    }

    const { activeElement } = document;

    if (activeElement === null) {
        console.log('false, activeElement is null');
        return false;
    }

    if (
        (activeElement.closest('form') ||
            activeElement.closest('iframe') ||
            activeElement.closest('[contenteditable]')) !== null
    ) {
        console.log('true, focus inside forbidden element');
        return true;
    }

    return false;
};

const useNewVersion = (config: ProtonConfig) => {
    const { VERSION_PATH, COMMIT } = config;

    const getVersion = () => fetch(VERSION_PATH).then((response) => response.json());

    const isNewVersionAvailable = async () => {
        try {
            const { commit } = await getVersion();

            return isDifferent(commit, COMMIT);
        } catch (error) {
            traceError(error);
        }
    };

    const handleVisibilityChange = () => {
        const documentIsVisible = !document.hidden && document.visibilityState === 'visible';

        if (!documentIsVisible && !userIsBusy()) {
            window.location.reload();
        }
    };

    useEffect(() => {
        const registerVisibilityChangeListener = () => {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        };

        const checkForNewVersion = async () => {
            if (await isNewVersionAvailable()) {
                registerVisibilityChangeListener();
            }
        };

        const checkForNewVersionIntervalId = window.setInterval(
            /*
             * If passed directly, produces eslint error:
             * Promise returned in function argument where a void return was expected (@typescript-eslint)
             */
            () => {
                checkForNewVersion();
            },
            EVERY_THIRTY_MINUTES
        );

        const unsub = versionInterface.subscribe(() => {
            registerVisibilityChangeListener();
        });

        return () => {
            clearInterval(checkForNewVersionIntervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            unsub();
        };
    }, []);
};

export default useNewVersion;
