import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { createHost } from '../lib';
import { Action, ProtonMessageResponses, ProtonMessages } from './interface';

const handler = async (message: ProtonMessages): Promise<ProtonMessageResponses | undefined> => {
    if (message.type === Action.getLocalStorage) {
        return getItem(message.payload.key);
    }

    if (message.type === Action.setLocalStorage) {
        setItem(message.payload.key, message.payload.value);
        return;
    }

    if (message.type === Action.removeLocalStorage) {
        removeItem(message.payload.key);
        return;
    }

    throw new Error(`Unknown message type`);
};

export const setupHostCrossStorage = () => {
    createHost<ProtonMessages, ProtonMessageResponses>(handler);
};
