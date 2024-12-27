import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

const getRecoveryMessageId = (userID: string) => `dr-${userID}`;

export const setRecoveryMessage = (userID: string, recoveryMessage: string) => {
    setItem(getRecoveryMessageId(userID), recoveryMessage);
};

export const getRecoveryMessage = (userID: string) => {
    return getItem(getRecoveryMessageId(userID));
};

export const getHasRecoveryMessage = (userID: string) => {
    return !!getRecoveryMessage(userID);
};

export const removeDeviceRecovery = (userID: string) => {
    removeItem(getRecoveryMessageId(userID));
};
