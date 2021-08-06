import { useEffect } from 'react';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { ProtonConfig } from '@proton/shared/lib/interfaces';

import { dialogRootClassName, dropdownRootClassName } from '../components';
import useApiStatus from './useApiStatus';

const EVERY_THIRTY_MINUTES = 30 * 60 * 1000;

const isDifferent = (a?: string, b?: string) => !!a && !!b && b !== a;

const activeElementIsInsideForm = () => {
    const { activeElement } = document;

    if (activeElement === null) {
        return false;
    }

    const closestFormAncestor = activeElement.closest('form');

    return closestFormAncestor !== null;
};

const dialogIsOpen = () => {
    return document.querySelector(`.${dialogRootClassName}`) !== null;
};

const dropdownIsOpen = () => {
    return document.querySelector(`.${dropdownRootClassName}`) !== null;
};

const useNewVersion = (config: ProtonConfig) => {
    const { appVersionBad } = useApiStatus();

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
        /*
         * These verification functions perform some dom querying operations
         * so in order to not unnecessarily waste performance we do ! &&
         * instead of || to short circuit and exit early should any of the
         * conditions fail before evaluationg all of
         */
        if (!documentIsVisible && !activeElementIsInsideForm() && !dialogIsOpen() && !dropdownIsOpen()) {
            window.location.reload();
        }
    };

    useEffect(() => {
        const registerVisibilityChangeListener = () => {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        };

        const checkForNewVersion = async () => {
            if ((await isNewVersionAvailable()) && !appVersionBad) {
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

        return () => {
            clearInterval(checkForNewVersionIntervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
};

export default useNewVersion;
