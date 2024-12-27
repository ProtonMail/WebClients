import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import create from '../lib/guest';
import type {
    GetLocalStorageKeysMessage,
    GetLocalStorageKeysMessageResponse,
    GetLocalStorageMessage,
    GetLocalStorageMessageResponse,
    MinimalSessionsResponse,
    RemoveLocalStorageMessage,
    RemoveLocalStorageMessageResponse,
    SessionsMessage,
    SetLocalStorageMessage,
    SetLocalStorageMessageResponse,
} from './interface';
import { Action } from './interface';

const createProtonInstance = (url: string) => create(url);

type CrossStorageInstance = ReturnType<typeof createProtonInstance>;

export type AccountCrossStorageInstance = ReturnType<typeof createHandlers>;
export let instance: AccountCrossStorageInstance;

const createHandlers = ({
    appName,
    crossStorageInstance: { postAndGetMessage, supported },
}: {
    appName: APP_NAMES;
    crossStorageInstance: CrossStorageInstance;
}) => {
    const getLocalStorage = (key: string) => {
        return postAndGetMessage<GetLocalStorageMessageResponse, GetLocalStorageMessage>({
            type: Action.getLocalStorage,
            payload: {
                key,
            },
        });
    };

    const getLocalStorageKeys = () => {
        return postAndGetMessage<GetLocalStorageKeysMessageResponse, GetLocalStorageKeysMessage>({
            type: Action.getLocalStorageKeys,
        });
    };

    const setLocalStorage = (key: string, value: string): Promise<void | undefined> => {
        return postAndGetMessage<SetLocalStorageMessageResponse, SetLocalStorageMessage>({
            type: Action.setLocalStorage,
            payload: {
                key,
                value,
            },
        });
    };

    const removeLocalStorage = (key: string): Promise<void | undefined> => {
        return postAndGetMessage<RemoveLocalStorageMessageResponse, RemoveLocalStorageMessage>({
            type: Action.removeLocalStorage,
            payload: {
                key,
            },
        });
    };

    const getSessions = <Argument extends 'minimal'>(type: Argument) => {
        return postAndGetMessage<Argument extends 'minimal' ? MinimalSessionsResponse : null, SessionsMessage>({
            type: Action.sessions,
            payload: {
                appName,
                type,
            },
        });
    };

    return {
        setLocalStorage,
        getLocalStorage,
        getLocalStorageKeys,
        removeLocalStorage,
        getSessions,
        supported,
    };
};

export const setupGuestCrossStorage = ({ appMode, appName }: { appMode: 'sso' | 'standalone'; appName: APP_NAMES }) => {
    if (appMode !== 'sso') {
        return;
    }
    instance = createHandlers({
        appName,
        crossStorageInstance: createProtonInstance(getAppHref('/storage.html', APPS.PROTONACCOUNT)),
    });
    return instance;
};
