import React from 'react';
import ExtraImages from '../extras/ExtraImages';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import ExtraSpamScore from '../extras/ExtraSpamScore';
import ExtraReadReceipt from '../extras/ExtraReadReceipt';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraExpirationTime from '../extras/ExtraExpirationTime';
import ExtraPinSigningKey from '../extras/ExtraPinSigningKey';
import ExtraAttachedKey from '../extras/ExtraAttachedKey';
import { MessageExtended } from '../../../models/message';
import ExtraErrors from '../extras/ExtraErrors';

interface Props {
    message: MessageExtended;
    sourceMode: boolean;
    onTrustKey: () => void;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
}

const HeaderExtra = ({ message, sourceMode, onTrustKey, onLoadRemoteImages, onLoadEmbeddedImages }: Props) => {
    return (
        <section className="ml1 mr1 mt0-5">
            <ExtraExpirationTime message={message} />
            <ExtraSpamScore message={message} />
            <ExtraErrors message={message} />
            <ExtraUnsubscribe message={message} />
            <ExtraReadReceipt message={message} />
            <ExtraAutoReply message={message} />
            <ExtraAttachedKey message={message} />
            <ExtraPinSigningKey message={message} onTrustKey={onTrustKey} />
            {/* TODO: askResign */}
            {!sourceMode && <ExtraImages message={message} type="remote" onLoadImages={onLoadRemoteImages} />}
            {!sourceMode && <ExtraImages message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />}
        </section>
    );
};

export default HeaderExtra;
