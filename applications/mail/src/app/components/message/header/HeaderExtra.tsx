import React from 'react';
import ExtraImages from '../extras/ExtraImages';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
}

const HeaderExtra = ({ message, onLoadRemoteImages, onLoadEmbeddedImages }: Props) => {
    return (
        <section className="ml1 mr1 mt0-5">
            {/* TODO: ExpirationTime */}
            {/* TODO: SpamScore */}
            {/* TODO: MIMEParsingFailed */}
            {/* TODO: hasError */}
            <ExtraUnsubscribe message={message} />
            {/* TODO: requireReadReceiptConfirmation */}
            {/* TODO: isAutoReply */}
            {/* TODO: attachedPublicKey */}
            {/* TODO: promptKeyPinning */}
            {/* TODO: askResign */}
            <ExtraImages message={message} type="remote" onLoadImages={onLoadRemoteImages} />
            <ExtraImages message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />
        </section>
    );
};

export default HeaderExtra;
