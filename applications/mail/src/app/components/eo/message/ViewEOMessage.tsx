import { useRef, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { EO_DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/eo/constants';

import type { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useLoadEOEmbeddedImages, useLoadEORemoteImages } from '../../../hooks/eo/useLoadEOImages';
import { useLoadEOMessage } from '../../../hooks/eo/useLoadEOMessage';
import MessageFooter from '../../message/extrasFooter/MessageFooter';
import EORedirect from '../EORedirect';
import EOHeaderExpanded from './EOHeaderExpanded';
import EOMessageBody from './EOMessageBody';
import EOMessageHeader from './EOMessageHeader';

import './EOMessage.scss';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const ViewEOMessage = ({ setSessionStorage }: Props) => {
    const elementRef = useRef<HTMLDivElement>(null);

    const [originalMessageMode, setOriginalMessageMode] = useState(false);

    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;

    const loadRemoteImages = useLoadEORemoteImages(EO_DEFAULT_MAILSETTINGS);
    const loadEmbeddedImages = useLoadEOEmbeddedImages(id || '');

    const { isStoreInitialized, messageState, message, outsideKey } = useLoadEOMessage({ id, setSessionStorage });

    const messageLoaded = !!messageState;
    const bodyLoaded = !!messageState?.messageDocument?.initialized;

    const toggleOriginalMessage = () => setOriginalMessageMode(!originalMessageMode);

    return (
        <EORedirect
            id={id}
            isStoreInitialized={isStoreInitialized}
            messageState={messageState}
            setSessionStorage={setSessionStorage}
        >
            {id && messageState && (
                <main
                    className="ui-standard sm:shadow-lifted shadow-color-primary relative overflow-hidden w-full max-w-custom mx-auto eo-layout"
                    style={{ '--max-w-custom': '52rem' }}
                >
                    <div ref={elementRef}>
                        <EOMessageHeader
                            message={messageState}
                            messageLoaded={messageLoaded}
                            id={id}
                            numberOfReplies={message.Replies.length}
                        />
                        <EOHeaderExpanded
                            labelID="test"
                            message={messageState}
                            messageLoaded={messageLoaded}
                            onLoadRemoteImages={loadRemoteImages}
                            onLoadEmbeddedImages={loadEmbeddedImages}
                            parentMessageRef={elementRef}
                        />
                        <EOMessageBody
                            message={messageState}
                            messageLoaded={messageLoaded}
                            bodyLoaded={bodyLoaded}
                            sourceMode={false}
                            onBlockquoteToggle={toggleOriginalMessage}
                            originalMessageMode={originalMessageMode}
                        />
                        <MessageFooter message={messageState} outsideKey={outsideKey} />
                    </div>
                </main>
            )}
        </EORedirect>
    );
};

export default ViewEOMessage;
