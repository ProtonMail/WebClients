import { uint8ArrayToBase64String } from './encoding';
import { removeItem, setItem } from './storage';

export const PASSWORD_CHANGE_MESSAGE_TYPE = 'password-change';

const CROSS_TAB_EVENT_KEY = 'cte';

let id: string | undefined;

const generateId = () => {
    return uint8ArrayToBase64String(crypto.getRandomValues(new Uint8Array(6)));
};

export const sendMessageToTabs = (type: string, data: any) => {
    if (!id) {
        id = generateId();
    }
    setItem(CROSS_TAB_EVENT_KEY, JSON.stringify({ id, type, data }));
    removeItem(CROSS_TAB_EVENT_KEY);
};

export const getIsSelf = (otherId: string) => otherId === id;

export const getMessage = (event: StorageEvent) => {
    if (event.key !== CROSS_TAB_EVENT_KEY || !event.newValue) {
        return;
    }
    try {
        const parsedData = JSON.parse(event.newValue);
        if (!parsedData?.type) {
            return;
        }
        return {
            id: parsedData.id,
            type: parsedData.type,
            data: parsedData.data,
        };
    } catch (e: any) {
        return undefined;
    }
};
