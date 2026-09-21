import { useRouteMatch } from 'react-router-dom';

import EOComposer from '@proton/mail-composer/components/eo/EOComposer';

import type { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useLoadEOMessage } from '../../../hooks/eo/useLoadEOMessage';
import EORedirect from '../EORedirect';
import EOReplyFooter from './EOReplyFooter';
import EOReplyHeader from './EOReplyHeader';

import './EOreply.scss';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const EOReply = ({ setSessionStorage }: Props) => {
    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;

    const { message, isStoreInitialized, messageState, outsideKey } = useLoadEOMessage({ id, setSessionStorage });

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
                    <EOComposer
                        referenceMessage={messageState}
                        encryptionKey={message.PublicKey}
                        outsideKey={outsideKey}
                        header={<EOReplyHeader message={messageState} />}
                        renderFooter={({ message: reply, onAddAttachments, exportReplyContent }) => (
                            <EOReplyFooter
                                id={id}
                                onAddAttachments={onAddAttachments}
                                exportReplyContent={exportReplyContent}
                                message={reply}
                                encryptionKey={message.PublicKey}
                                outsideKey={outsideKey}
                                numberOfReplies={message.Replies.length}
                            />
                        )}
                    />
                </main>
            )}
        </EORedirect>
    );
};

export default EOReply;
