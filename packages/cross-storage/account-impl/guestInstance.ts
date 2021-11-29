import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, isSSOMode } from '@proton/shared/lib/constants';
import create from '../lib/guest';
import {
    GetLocalStorageMessageResponse,
    ProtonMessages,
    RemoveLocalStorageMessageResponse,
    SetLocalStorageMessageResponse,
} from './interface';

const createProtonInstance = (url: string) => create<ProtonMessages>(url);

type CrossStorageInstance = ReturnType<typeof createProtonInstance>;

export let instance: ReturnType<typeof createHandlers>;

const createHandlers = ({ postAndGetMessage }: CrossStorageInstance) => {
    const getLocalStorage = (key: string) => {
        return postAndGetMessage<GetLocalStorageMessageResponse>({
            type: 'getLocalStorage',
            payload: {
                key,
            },
        });
    };

    const setLocalStorage = (key: string, value: string): Promise<void | undefined> => {
        return postAndGetMessage<SetLocalStorageMessageResponse>({
            type: 'setLocalStorage',
            payload: {
                key,
                value,
            },
        });
    };

    const removeLocalStorage = (key: string): Promise<void | undefined> => {
        return postAndGetMessage<RemoveLocalStorageMessageResponse>({
            type: 'removeLocalStorage',
            payload: {
                key,
            },
        });
    };

    return {
        setLocalStorage,
        getLocalStorage,
        removeLocalStorage,
    };
};

export const setupGuestCrossStorage = () => {
    if (!isSSOMode) {
        return;
    }
    instance = createHandlers(createProtonInstance(getAppHref('/storage.html', APPS.PROTONACCOUNT)));
};
