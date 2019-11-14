import React from 'react';
import PropTypes from 'prop-types';
import ExtraImages from './extras/ExtraImages';
import ExtraUnsubscribe from './extras/ExtraUnsubscribe';

const MessageHeaderExtra = ({ message, onLoadRemoteImages, onLoadEmbeddedImages }) => {
    return (
        <section className="mt0-5 stop-propagation">
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

MessageHeaderExtra.propTypes = {
    message: PropTypes.object.isRequired,
    onLoadRemoteImages: PropTypes.func.isRequired,
    onLoadEmbeddedImages: PropTypes.func.isRequired
};

export default MessageHeaderExtra;
