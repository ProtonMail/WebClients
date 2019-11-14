import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Tooltip, Href } from 'react-components';
import { displaySignatureStatus } from './logic/displaySignature';
import { isPGPEncrypted } from './logic/message';
import { getEncryptionType } from './logic/encryptionType';

// Reference: Angular/src/templates/message/encryptionStatus.tpl.html

const MessageLock = ({ message }) => {
    const displaySignature = displaySignatureStatus(message);
    const pgpEncrypted = isPGPEncrypted(message.data);
    const title = getEncryptionType(message);

    return (
        <>
            {!displaySignature && !pgpEncrypted && (
                <Tooltip title={title}>
                    <Href
                        className="color-global-grey no-pointer-events-children"
                        href="https://protonmail.com/support/knowledge-base/what-is-encrypted/"
                    >
                        {/* TODO: 'color-pm-blue': message.isInternal() || message.isSentEncrypted() || message.isDraft() || message.isAuto(), */}
                        <Icon name="lock" />
                    </Href>
                </Tooltip>
            )}
        </>
    );
};

MessageLock.propTypes = {
    message: PropTypes.object.isRequired
};

export default MessageLock;
