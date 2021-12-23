import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Redirect, useRouteMatch } from 'react-router-dom';

import { Loader, useActiveBreakpoint, useApi } from '@proton/components';
import Main from 'proton-account/src/app/public/Main';

import EOMessageHeader from './EOMessageHeader';
import EOHeaderExpanded from './EOHeaderExpanded';
import EOMessageBody from './EOMessageBody';
import { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useOutsideMessage } from '../../../hooks/eo/useOutsideMessage';
import { useLoadEOEmbeddedImages, useLoadEORemoteImages } from '../../../hooks/eo/useLoadEOImages';
import { useInitializeEOMessage } from '../../../hooks/eo/useInitializeEOMessage';
import { OutsideKey } from '../../../logic/messages/messagesTypes';
import { LOAD_RETRY_COUNT } from '../../../constants';
import { loadEOMessage } from '../../../logic/eo/eoActions';
import MessageFooter from '../../message/MessageFooter';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const ViewMessage = ({ setSessionStorage }: Props) => {
    const breakpoints = useActiveBreakpoint();
    const elementRef = useRef<HTMLDivElement>(null);
    const api = useApi();
    const dispatch = useDispatch();

    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;

    const { isStoreInitialized, decryptedToken, password, messageState, message } = useOutsideMessage({ id });

    const loadRemoteImages = useLoadEORemoteImages();
    const loadEmbeddedImages = useLoadEOEmbeddedImages(id || '');

    const initialize = useInitializeEOMessage();

    const shouldRedirectToUnlock = (!password || !decryptedToken) && isStoreInitialized;

    const messageLoaded = !!messageState;
    const bodyLoaded = !!messageState?.messageDocument?.initialized;

    const outsideKey = useMemo(() => {
        return {
            type: 'outside',
            id,
            decryptedToken,
            password,
        } as OutsideKey;
    }, [id, decryptedToken, password]);

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

    return (
        <Main larger className="mw52r">
            <div ref={elementRef}>
                <div className="flex flex-align-items-center border-bottom p1">
                    <EOMessageHeader
                        message={messageState}
                        messageLoaded={messageLoaded}
                        id={id}
                        numberOfReplies={message.Replies.length}
                    />
                </div>
                <EOHeaderExpanded
                    labelID="test"
                    message={messageState}
                    messageLoaded={messageLoaded}
                    onLoadRemoteImages={loadRemoteImages}
                    onLoadEmbeddedImages={loadEmbeddedImages}
                    breakpoints={breakpoints}
                    parentMessageRef={elementRef}
                />
                <EOMessageBody
                    message={messageState}
                    messageLoaded={messageLoaded}
                    bodyLoaded={bodyLoaded}
                    sourceMode={false}
                />
                <MessageFooter message={messageState} outsideKey={outsideKey} />
            </div>
        </Main>
    );
};

export default ViewMessage;
