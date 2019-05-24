export const ACTIONS = {
    ADD: 'create',
    RESET: 'reset',
    REMOVE: 'remove',
    REACTIVATE: 'reactivate',
    SET_PRIMARY: 'set-primary',
    SET_FLAGS: 'set-flags'
};

export const addKeyAction = ({ ID, decryptedPrivateKey, flags }) => {
    return {
        type: ACTIONS.ADD,
        payload: {
            ID,
            decryptedPrivateKey,
            flags
        }
    };
};

export const reactivateKeyAction = ({ ID, decryptedPrivateKey, flags }) => {
    return {
        type: ACTIONS.REACTIVATE,
        payload: {
            ID,
            decryptedPrivateKey,
            flags
        }
    };
};

export const removeKeyAction = (ID) => {
    return {
        type: ACTIONS.REMOVE,
        payload: {
            ID
        }
    };
};

export const setPrimaryKeyAction = (ID) => {
    return {
        type: ACTIONS.SET_PRIMARY,
        payload: {
            ID
        }
    };
};

export const setFlagsKeyAction = (ID, flags) => {
    return {
        type: ACTIONS.SET_FLAGS,
        payload: {
            ID,
            newFlags: flags
        }
    };
};
