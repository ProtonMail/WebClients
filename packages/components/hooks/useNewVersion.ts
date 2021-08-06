import { useEffect } from 'react';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { ProtonConfig } from '@proton/shared/lib/interfaces';

import { dialogRootClassName, dropdownRootClassName } from '../components';
import useApiStatus from './useApiStatus';

const EVERY_MINUTE = 60 * 1000;

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
    return document.querySelector(`.${  dialogRootClassName}`) !== null;
};

const dropdownIsOpen = () => {
    return document.querySelector(`.${  dropdownRootClassName}`) !== null;
};

const pageIsVisible = () => {
    return !document.hidden && document.visibilityState === 'visible';
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

    const attemptUpdatingToNewVersion = () => {
        /*
         * These verification functions perform some dom querying operations
         * so in order to not unnecessarily waste performance we do ! &&
         * instead of || to short circuit and exit early should any of the
         * conditions fail before evaluationg all of
         */
        if (!pageIsVisible() && !activeElementIsInsideForm() && !dialogIsOpen() && !dropdownIsOpen()) {
            window.location.reload();
        }
    };

    useEffect(() => {
        let attemptUpdatingToNewVersionIntervalId: number;

        const scheduleAttemptToUpdateToNewVersion = () => {
            attemptUpdatingToNewVersionIntervalId = window.setInterval(attemptUpdatingToNewVersion, EVERY_MINUTE);
        };

        const checkForNewVersion = async () => {
            if ((await isNewVersionAvailable()) && !appVersionBad) {
                scheduleAttemptToUpdateToNewVersion();
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
            clearInterval(attemptUpdatingToNewVersionIntervalId);
        };
    }, []);
};

export default useNewVersion;
