import { useEffect } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { Loader, useApi } from '@proton/components';
import Main from 'proton-account/src/app/public/Main';
import { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useOutsideMessage } from '../../../hooks/eo/useOutsideMessage';
import { loadEOMessage } from '../../../logic/eo/eoActions';
import EOComposer from './EOComposer';
import { OutsideKey } from '../../../logic/messages/messagesTypes';

import './EOreply.scss';
import { useInitializeEOMessage } from '../../../hooks/eo/useInitializeEOMessage';
import { LOAD_RETRY_COUNT } from '../../../constants';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const Reply = ({ setSessionStorage }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();

    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;

    const initialize = useInitializeEOMessage();

    const { message, isStoreInitialized, decryptedToken, password, messageState } = useOutsideMessage({ id });

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
        return <Redirect to="/eo" />;
    }

    if (shouldRedirectToUnlock) {
        return <Redirect to={`/eo/${id}`} />;
    }

    if (!isStoreInitialized || !messageState || !messageState?.messageDocument?.initialized) {
        return <Loader />;
    }

    const outsideKey = {
        type: 'outside',
        password,
        id,
        decryptedToken,
    } as OutsideKey;

    return (
        <Main larger className="mw52r">
            <EOComposer
                referenceMessage={messageState}
                isFocused
                id={id}
                publicKey={message.PublicKey}
                outsideKey={outsideKey}
            />
        </Main>
    );
};

export default Reply;
