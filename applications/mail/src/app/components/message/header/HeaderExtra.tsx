import { isReceived } from 'proton-shared/lib/mail/messages';
import React from 'react';
import ExtraImages from '../extras/ExtraImages';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import ExtraSpamScore from '../extras/ExtraSpamScore';
import ExtraReadReceipt from '../extras/ExtraReadReceipt';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraExpirationTime from '../extras/ExtraExpirationTime';
import ExtraEvents from '../extras/ExtraEvents';
import ExtraPinKey from '../extras/ExtraPinKey';
import ExtraAskResign from '../extras/ExtraAskResign';
import { MessageExtended } from '../../../models/message';
import ExtraErrors from '../extras/ExtraErrors';
import ExtraDecryptedSubject from '../extras/ExtraDecryptedSubject';
import { OnCompose } from '../../../hooks/composer/useCompose';

interface Props {
    message: MessageExtended;
    sourceMode: boolean;
    onResignContact: () => void;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onCompose: OnCompose;
}

const HeaderExtra = ({
    message,
    sourceMode,
    messageLoaded,
    bodyLoaded,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    onCompose,
}: Props) => {
    const received = message.data && isReceived(message.data);
    return (
        <section className="message-header-extra border-top pt0-5">
            <ExtraExpirationTime message={message} />
            <ExtraDecryptedSubject message={message} />
            <ExtraSpamScore message={message} />
            {bodyLoaded && <ExtraErrors message={message} />}
            <ExtraUnsubscribe message={message} onCompose={onCompose} />
            <ExtraReadReceipt message={message} />
            <ExtraAutoReply message={message} />
            {messageLoaded && <ExtraPinKey message={message.data} messageVerification={message.verification} />}
            <ExtraAskResign
                message={message.data}
                messageVerification={message.verification}
                onResignContact={onResignContact}
            />
            {!sourceMode && <ExtraImages message={message} type="remote" onLoadImages={onLoadRemoteImages} />}
            {!sourceMode && <ExtraImages message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />}
            {messageLoaded && received ? <ExtraEvents message={message} /> : null}
        </section>
    );
};

export default HeaderExtra;
