import { useRouteMatch } from 'react-router-dom';

import { EOUrlParams } from '../../../helpers/eo/eoUrl';
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
                <main className="ui-standard shadow-lifted on-tiny-mobile-no-box-shadow relative no-scroll w100 max-w100 center eo-layout mw52r">
                    <EOComposer
                        referenceMessage={messageState}
                        id={id}
                        publicKey={message.PublicKey}
                        outsideKey={outsideKey}
                        numberOfReplies={message.Replies.length}
                    />
                </main>
            )}
        </EORedirect>
    );
};

export default EOReply;
