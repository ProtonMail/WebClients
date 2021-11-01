import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { createHost } from '../lib';
import { ProtonMessageResponses, ProtonMessages } from './interface';

const handler = async (message: ProtonMessages): Promise<ProtonMessageResponses | undefined> => {
    if (message.type === 'getLocalStorage') {
        return getItem(message.payload.key);
    }

    if (message.type === 'setLocalStorage') {
        setItem(message.payload.key, message.payload.value);
        return;
    }

    throw new Error(`Unknown message type`);
};

export const setupHostCrossStorage = () => {
    createHost<ProtonMessages, ProtonMessageResponses>(handler);
};
