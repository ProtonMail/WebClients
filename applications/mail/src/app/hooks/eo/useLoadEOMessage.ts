import { useCallback, useEffect, useMemo } from 'react';

import { useApi } from '@proton/components';
import type { OutsideKey } from '@proton/mail/store/messages/messagesTypes';

import { useEOMailDispatch, useEOMailSelector, useEOMailStore } from 'proton-mail/store/eo/hooks';

import { initEncryptedToken, loadEOToken } from '../../store/eo/eoActions';
import {
    eoDecryptedTokenSelector,
    eoMessageSelector,
    eoMessageStateSelector,
    eoTokenSelector,
    isEncryptedTokenInitializedSelector,
    isStoreInitializedSelector,
    passwordSelector,
} from '../../store/eo/eoSelectors';

export const useGetEOMessage = () => {
    const store = useEOMailStore();
    return useCallback(() => eoMessageSelector(store.getState()), []);
};

export const useGetEOToken = () => {
    const store = useEOMailStore();
    return useCallback(() => eoTokenSelector(store.getState()), []);
};

export const useGetEODecryptedToken = () => {
    const store = useEOMailStore();
    return useCallback(() => eoDecryptedTokenSelector(store.getState()), []);
};

export const useGetEOMessageState = () => {
    const store = useEOMailStore();

    return useCallback(() => eoMessageStateSelector(store.getState()), []);
};

export const useGetEOPassword = () => {
    const store = useEOMailStore();
    return useCallback(() => passwordSelector(store.getState()), []);
};

interface Props {
    id: string | undefined;
    setSessionStorage: (key: string, data: any) => void;
}

export const useLoadEOMessage = ({ id, setSessionStorage }: Props) => {
    const dispatch = useEOMailDispatch();
    const api = useApi();

    const encryptedToken = useEOMailSelector((state) => eoTokenSelector(state));
    const decryptedToken = useEOMailSelector((state) => eoDecryptedTokenSelector(state));
    const eoMessageState = useEOMailSelector((state) => eoMessageSelector(state));
    const isStoreInitialized = useEOMailSelector((state) => isStoreInitializedSelector(state));
    const isEncryptedTokenInitialized = useEOMailSelector((state) => isEncryptedTokenInitializedSelector(state));
    const password = useEOMailSelector((state) => passwordSelector(state));
    const messageState = useEOMailSelector((state) => eoMessageStateSelector(state));

    const outsideKey = useMemo(() => {
        return {
            type: 'outside',
            password,
            id,
            decryptedToken,
        } as OutsideKey;
    }, [password, decryptedToken, id]);

    // When opening the app, we try to get the session from the secureSessionStorage.
    // If session has not been found, we try to load the EO token from the ID in the URL
    useEffect(() => {
        const fetchToken = async (id: string) => {
            try {
                await dispatch(loadEOToken({ api, id, set: setSessionStorage }));
            } catch (error: any | undefined) {
                console.error(error);
            }
        };

        if (isStoreInitialized && id && (!encryptedToken || encryptedToken === '')) {
            void fetchToken(id);
        } else if (!id) {
            dispatch(initEncryptedToken());
        }
    }, [encryptedToken, isStoreInitialized]);

    return {
        encryptedToken,
        isStoreInitialized,
        isEncryptedTokenInitialized,
        message: eoMessageState,
        decryptedToken,
        password,
        messageState,
        outsideKey,
    };
};
