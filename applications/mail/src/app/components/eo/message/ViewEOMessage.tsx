import { useRef } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { useActiveBreakpoint } from '@proton/components';
import { eoDefaultMailSettings } from '@proton/shared/lib/mail/eo/constants';

import EOMessageHeader from './EOMessageHeader';
import EOHeaderExpanded from './EOHeaderExpanded';
import EOMessageBody from './EOMessageBody';
import { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useLoadEOMessage } from '../../../hooks/eo/useLoadEOMessage';
import { useLoadEOEmbeddedImages, useLoadEORemoteImages } from '../../../hooks/eo/useLoadEOImages';
import MessageFooter from '../../message/MessageFooter';
import EORedirect from '../EORedirect';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const ViewEOMessage = ({ setSessionStorage }: Props) => {
    const breakpoints = useActiveBreakpoint();
    const elementRef = useRef<HTMLDivElement>(null);

    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;

    const loadRemoteImages = useLoadEORemoteImages(eoDefaultMailSettings);
    const loadEmbeddedImages = useLoadEOEmbeddedImages(id || '');

    const { isStoreInitialized, messageState, message, outsideKey } = useLoadEOMessage({ id, setSessionStorage });

    const messageLoaded = !!messageState;
    const bodyLoaded = !!messageState?.messageDocument?.initialized;

    return (
        <EORedirect
            id={id}
            isStoreInitialized={isStoreInitialized}
            messageState={messageState}
            setSessionStorage={setSessionStorage}
        >
            {id && messageState && (
                <main className="ui-standard color-norm bg-norm relative no-scroll w100 max-w100 center eo-layout mw52r">
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
                </main>
            )}
        </EORedirect>
    );
};

export default ViewEOMessage;
