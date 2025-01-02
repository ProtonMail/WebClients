import { createHost } from '@proton/cross-storage';
import { Action, type ProtonMessageResponses, type ProtonMessages } from '@proton/cross-storage/account-impl';
import {
    getMinimalPersistedSession,
    getPersistedSessions,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

const handler = async (message: ProtonMessages): Promise<ProtonMessageResponses | undefined> => {
    if (message.type === Action.getLocalStorage) {
        return getItem(message.payload.key);
    }

    if (message.type === Action.getLocalStorageKeys) {
        return [...Object.keys(window.localStorage)];
    }

    if (message.type === Action.setLocalStorage) {
        setItem(message.payload.key, message.payload.value);
        return;
    }

    if (message.type === Action.removeLocalStorage) {
        removeItem(message.payload.key);
        return;
    }

    if (message.type === Action.sessions) {
        if (message.payload.type === 'minimal') {
            return {
                type: 'minimal',
                sessions: getPersistedSessions().map(getMinimalPersistedSession),
            };
        }
    }

    throw new Error(`Unknown message type`);
};

createHost<ProtonMessages, ProtonMessageResponses>(handler);
