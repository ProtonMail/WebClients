import React from 'react';
import PropTypes from 'prop-types';
import { Icon, LinkButton, Tooltip } from 'react-components';
import { displaySignatureStatus } from './logic/displaySignature';
import { isPGPEncrypted } from './logic/message';
import { getEncryptionType } from './logic/encryptionType';

// Reference: Angular/src/templates/message/encryptionStatus.tpl.html

const MessageLock = ({ message, messageMetadata }) => {
    const displaySignature = displaySignatureStatus(message, messageMetadata.verified);
    const pgpEncrypted = isPGPEncrypted(message);

    return (
        <>
            {!displaySignature && !pgpEncrypted && (
                <Tooltip title={getEncryptionType(message, messageMetadata.verified)}>
                    <LinkButton
                        className="nodecoration color-global-grey no-pointer-events-children flex"
                        href="https://protonmail.com/support/knowledge-base/what-is-encrypted/"
                    >
                        {/* TODO: 'color-pm-blue': message.isInternal() || message.isSentEncrypted() || message.isDraft() || message.isAuto(), */}
                        <Icon name="lock" />
                    </LinkButton>
                </Tooltip>
            )}
        </>
    );
};

MessageLock.propTypes = {
    message: PropTypes.object.isRequired,
    messageMetadata: PropTypes.object.isRequired
};

export default MessageLock;
