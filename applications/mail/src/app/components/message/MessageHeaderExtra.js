import React from 'react';
import PropTypes from 'prop-types';
import { Icon, LinkButton } from 'react-components';
import { c } from 'ttag';

const MessageHeaderExtra = ({ messageMetadata, onLoadImages }) => {
    const showRemote = messageMetadata.hasImages && !messageMetadata.showImages;

    return (
        <section className="mt0-5">
            {/* TODO: ExpirationTime */}
            {/* TODO: SpamScore */}
            {/* TODO: MIMEParsingFailed */}
            {/* TODO: hasError */}
            {/* TODO: unsubscribe */}
            {/* TODO: requireReadReceiptConfirmation */}
            {/* TODO: isAutoReply */}
            {/* TODO: attachedPublicKey */}
            {/* TODO: promptKeyPinning */}
            {/* TODO: askResign */}
            {showRemote && (
                <div className="bg-white w100 rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
                    <Icon name="insert-image" />
                    <span className="w100 flex flex-wrap">
                        <span className="pl0-5 pr0-5 mtauto mbauto flex-item-fluid-auto">
                            <span className="displayContentBtn-notice-text">This message contains remote content</span>{' '}
                        </span>
                        <span className="flex-item-noshrink flex">
                            <LinkButton onClick={onLoadImages}>{c('Action').t`Load`}</LinkButton>
                        </span>
                    </span>
                </div>
            )}
        </section>
    );
};

MessageHeaderExtra.propTypes = {
    message: PropTypes.object.isRequired,
    messageMetadata: PropTypes.object.isRequired,
    onLoadImages: PropTypes.func.isRequired
};

export default MessageHeaderExtra;
