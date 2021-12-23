import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { useApi } from '@proton/components';
import { RootState } from '../../logic/eo/eoStore';
import {
    eoDecryptedTokenSelector,
    eoMessageSelector,
    eoMessageStateSelector,
    eoTokenSelector,
    isStoreInitializedSelector,
    passwordSelector,
} from '../../logic/eo/eoSelectors';
import { loadEOToken } from '../../logic/eo/eoActions';

export const useGetEOMessage = () => {
    const store = useStore<RootState>();
    return useCallback(() => eoMessageSelector(store.getState()), []);
};

export const useGetEOToken = () => {
    const store = useStore<RootState>();
    return useCallback(() => eoTokenSelector(store.getState()), []);
};

export const useGetEODecryptedToken = () => {
    const store = useStore<RootState>();
    return useCallback(() => eoDecryptedTokenSelector(store.getState()), []);
};

export const useGetMessageState = () => {
    const store = useStore<RootState>();
    return useCallback(() => eoMessageStateSelector(store.getState()), []);
};

export const useGetPassword = () => {
    const store = useStore<RootState>();
    return useCallback(() => passwordSelector(store.getState()), []);
};

interface Props {
    id: string | undefined;
    setSessionStorage?: (key: string, data: any) => void;
}

export const useOutsideMessage = ({ id, setSessionStorage }: Props) => {
    const dispatch = useDispatch();
    const api = useApi();

    const eoToken = useSelector((state: RootState) => eoTokenSelector(state));
    const eoDecryptedToken = useSelector((state: RootState) => eoDecryptedTokenSelector(state));
    const eoMessageState = useSelector((state: RootState) => eoMessageSelector(state));
    const isStoreInitialized = useSelector((state: RootState) => isStoreInitializedSelector(state));
    const password = useSelector((state: RootState) => passwordSelector(state));
    const messageState = useSelector((state: RootState) => eoMessageStateSelector(state));

    // When opening the app, we try to get the session from the secureSessionStorage.
    // If session has not been found, we try to load the EO token from the ID in the URL
    useEffect(() => {
        const fetchToken = async (id: string) => {
            if (setSessionStorage) {
                try {
                    await dispatch(loadEOToken({ api, id, set: setSessionStorage }));
                } catch (error: any | undefined) {
                    console.error(error);
                }
            }
        };

        if (isStoreInitialized && id && (!eoToken || eoToken === '')) {
            void fetchToken(id);
        }
    }, [eoToken, isStoreInitialized]);

    return {
        encryptedToken: eoToken,
        isStoreInitialized,
        message: eoMessageState,
        decryptedToken: eoDecryptedToken,
        password,
        messageState,
    };
};
