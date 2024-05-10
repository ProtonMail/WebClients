import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { appMode } from '@proton/shared/lib/webpack.constants';

import create from '../lib/guest';
import {
    Action,
    GetLocalStorageKeysMessageResponse,
    GetLocalStorageMessageResponse,
    ProtonMessages,
    RemoveLocalStorageMessageResponse,
    SetLocalStorageMessageResponse,
} from './interface';

const createProtonInstance = (url: string) => create<ProtonMessages>(url);

type CrossStorageInstance = ReturnType<typeof createProtonInstance>;

export let instance: ReturnType<typeof createHandlers>;

const createHandlers = ({ postAndGetMessage, supported }: CrossStorageInstance) => {
    const getLocalStorage = (key: string) => {
        return postAndGetMessage<GetLocalStorageMessageResponse>({
            type: Action.getLocalStorage,
            payload: {
                key,
            },
        });
    };

    const getLocalStorageKeys = () => {
        return postAndGetMessage<GetLocalStorageKeysMessageResponse>({
            type: Action.getLocalStorageKeys,
        });
    };

    const setLocalStorage = (key: string, value: string): Promise<void | undefined> => {
        return postAndGetMessage<SetLocalStorageMessageResponse>({
            type: Action.setLocalStorage,
            payload: {
                key,
                value,
            },
        });
    };

    const removeLocalStorage = (key: string): Promise<void | undefined> => {
        return postAndGetMessage<RemoveLocalStorageMessageResponse>({
            type: Action.removeLocalStorage,
            payload: {
                key,
            },
        });
    };

    return {
        setLocalStorage,
        getLocalStorage,
        getLocalStorageKeys,
        removeLocalStorage,
        supported,
    };
};

export const setupGuestCrossStorage = () => {
    if (appMode !== 'sso') {
        return;
    }
    instance = createHandlers(createProtonInstance(getAppHref('/storage.html', APPS.PROTONACCOUNT)));
};
