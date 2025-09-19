import { c } from 'ttag';

import type { Maybe } from '@proton/pass/types';

import { StorageKeyError } from './types';

export const formatReadError = (error: StorageKeyError): string => {
    const action = c('authenticator-2025:Action').t`Please try again or reset to create a new one.`;

    const base = (() => {
        switch (error) {
            case StorageKeyError.CORRUPTED:
                return c('authenticator-2025:Error').t`Your storage key appears to be damaged and can't be read.`;
            case StorageKeyError.NO_EXIST:
                return c('authenticator-2025:Error').t`Your storage key is missing and needs to be recreated.`;
            case StorageKeyError.PLATFORM:
                return c('authenticator-2025:Error').t`Unable to access your secure storage key due to a system issue.`;
            case StorageKeyError.UNKNOWN:
                return c('authenticator-2025:Error').t`The app couldn’t access your storage key.`;
        }
    })();

    return `${base} ${action}`;
};

export const formatGenerateError = (error: StorageKeyError): string => {
    const action = c('authenticator-2025:Action').t`Please try again.`;

    const base = (() => {
        switch (error) {
            case StorageKeyError.PLATFORM:
                return c('authenticator-2025:Error')
                    .t`We couldn't create your secure storage key due to a system limitation.`;
            default:
                return c('authenticator-2025:Error').t`We couldn't generate your secure storage key.`;
        }
    })();

    return `${base} ${action}`;
};

export const formatResetKeyWarning = () =>
    c('authenticator-2025:Warning').t`Resetting your storage key will erase any local data that hasn’t been synced.`;

export const formatUnsafeStorageKeyWarning = (warn: boolean): Maybe<string> => {
    if (!warn) return;
    return c('authenticator-2025:Warning')
        .t`If you continue without setting up a secure storage key, your data will still be encrypted locally, but the key will be saved less securely.`;
};
