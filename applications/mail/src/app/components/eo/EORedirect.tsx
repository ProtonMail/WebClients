import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Redirect } from 'react-router-dom';

import { Loader, useApi } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { EO_REDIRECT_PATH, LOAD_RETRY_COUNT } from '../../constants';
import { useInitializeEOMessage } from '../../hooks/eo/useInitializeEOMessage';
import { useGetEODecryptedToken, useGetEOPassword } from '../../hooks/eo/useLoadEOMessage';
import { loadEOMessage } from '../../store/eo/eoActions';

interface Props {
    id?: string;
    isStoreInitialized: boolean;
    messageState: MessageState;
    setSessionStorage: (key: string, data: any) => void;
    children?: ReactNode;
}

const EORedirect = ({ id, isStoreInitialized, messageState, children, setSessionStorage }: Props) => {
    const dispatch = useMailDispatch();
    const api = useApi();

    const getPassword = useGetEOPassword();
    const getDecryptedToken = useGetEODecryptedToken();

    const initialize = useInitializeEOMessage();

    const password = getPassword();
    const decryptedToken = getDecryptedToken();

    const shouldRedirectToUnlock = (!password || !decryptedToken) && isStoreInitialized;

    useEffect(() => {
        if (isStoreInitialized && messageState && messageState?.messageDocument?.initialized === undefined) {
            if ((messageState.loadRetry || 0) > LOAD_RETRY_COUNT) {
                return;
            }
            void initialize();
        }
    }, [isStoreInitialized, messageState?.messageDocument?.initialized, messageState]);

    useEffect(() => {
        const loadMessage = async (id: string) => {
            await dispatch(loadEOMessage({ api, token: decryptedToken, id, password, set: setSessionStorage }));
        };

        if (id && decryptedToken && password && isStoreInitialized && messageState === undefined) {
            void loadMessage(id);
        }
    }, [decryptedToken, password, id, messageState, isStoreInitialized]);

    if (!id) {
        return <Redirect to={EO_REDIRECT_PATH} />;
    }

    if (shouldRedirectToUnlock) {
        return <Redirect to={`${EO_REDIRECT_PATH}/${id}`} />;
    }

    if (!isStoreInitialized || !messageState || !messageState?.messageDocument?.initialized) {
        return <Loader />;
    }

    return <>{children}</>;
};

export default EORedirect;
