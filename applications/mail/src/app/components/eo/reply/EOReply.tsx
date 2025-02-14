import { useRouteMatch } from 'react-router-dom';

import type { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useLoadEOMessage } from '../../../hooks/eo/useLoadEOMessage';
import EORedirect from '../EORedirect';
import EOComposer from './EOComposer';

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
                        id={id}
                        encryptionKey={message.PublicKey}
                        outsideKey={outsideKey}
                        numberOfReplies={message.Replies.length}
                    />
                </main>
            )}
        </EORedirect>
    );
};

export default EOReply;
