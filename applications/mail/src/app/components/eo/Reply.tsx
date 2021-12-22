import { useEffect } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { useApi } from '@proton/components';
import Main from 'proton-account/src/app/public/Main';
import { EOUrlParams } from '../../helpers/eo/eoUrl';
import { useOutsideMessage } from '../../hooks/eo/useOutsideMessage';
import { loadEOMessage } from '../../logic/eo/eoActions';
import EOReplyHeader from './reply/EOReplyHeader';
import EOComposer from './reply/EOComposer';
import { OutsideKey } from '../../logic/messages/messagesTypes';

import './EOreply.scss';

const Reply = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;

    const { message, isStoreInitialized, decryptedToken, password, messageState } = useOutsideMessage({ id });

    const shouldRedirectToUnlock = (!password || !decryptedToken) && isStoreInitialized;

    useEffect(() => {
        const loadMessage = async (id: string) => {
            await dispatch(loadEOMessage({ api, token: decryptedToken, id, password }));
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

    if (!isStoreInitialized || !messageState) {
        return <>Loading</>;
    }

    const outsideKey = {
        type: 'outside',
        password,
        id,
        decryptedToken,
    } as OutsideKey;

    return (
        <Main larger className="mw52r">
            <EOReplyHeader message={messageState} />
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
