import React from 'react';
import ExtraImages from '../extras/ExtraImages';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import ExtraSpamScore from '../extras/ExtraSpamScore';
import ExtraReadReceipt from '../extras/ExtraReadReceipt';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraExpirationTime from '../extras/ExtraExpirationTime';
import ExtraPinKey from '../extras/ExtraPinKey';
import ExtraAttachedKey from '../extras/ExtraAttachedKey';
import ExtraAskResign from '../extras/ExtraAskResign';
import { MessageExtended } from '../../../models/message';
import ExtraErrors from '../extras/ExtraErrors';
import ExtraDecryptedSubject from '../extras/ExtraDecryptedSubject';

interface Props {
    message: MessageExtended;
    sourceMode: boolean;
    onTrustKey: () => void;
    onResignContact: () => void;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
}

const HeaderExtra = ({
    message,
    sourceMode,
    onTrustKey,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages
}: Props) => {
    return (
        <section className="message-header-extra mt0-5 border-top pt0-5">
            <ExtraExpirationTime message={message} />
            <ExtraDecryptedSubject message={message} />
            <ExtraSpamScore message={message} />
            <ExtraErrors message={message} />
            <ExtraUnsubscribe message={message} />
            <ExtraReadReceipt message={message} />
            <ExtraAutoReply message={message} />
            <ExtraAttachedKey message={message} />
            <ExtraPinKey message={message} onTrustKey={onTrustKey} />
            <ExtraAskResign message={message} onResignContact={onResignContact} />
            {!sourceMode && <ExtraImages message={message} type="remote" onLoadImages={onLoadRemoteImages} />}
            {!sourceMode && <ExtraImages message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />}
        </section>
    );
};

export default HeaderExtra;
