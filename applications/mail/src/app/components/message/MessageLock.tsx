import React from 'react';
import { Icon, Tooltip, Href, classnames } from 'react-components';
import { displaySignatureStatus } from '../../helpers/displaySignature';
import { isPGPEncrypted, isInternal, isSentEncrypted, isDraft, isAuto } from '../../helpers/message/messages';
import { getEncryptionType } from '../../helpers/encryptionType';
import { MessageExtended } from '../../models/message';

// Reference: Angular/src/templates/message/encryptionStatus.tpl.html

interface Props {
    message: MessageExtended;
    className?: string;
}

const MessageLock = ({ message, className: inputClassName }: Props) => {
    const displaySignature = displaySignatureStatus(message);
    const pgpEncrypted = isPGPEncrypted(message.data);

    const tooltip = getEncryptionType(message);
    const href = displaySignature
        ? 'https://protonmail.com/support/knowledge-base/digital-signature/'
        : pgpEncrypted
        ? 'https://protonmail.com/support/knowledge-base/how-to-use-pgp'
        : 'https://protonmail.com/support/knowledge-base/what-is-encrypted/';
    // TODO: add lock-signed lock-warning in design system
    // const icon = displaySignature ? (message.verified ? 'lock-signed' : 'lock-warning') : 'lock';
    const icon = 'lock';
    const internal =
        isInternal(message.data) || isSentEncrypted(message.data) || isDraft(message.data) || isAuto(message.data);
    const className = classnames([
        inputClassName,
        'no-pointer-events-children',
        ...(displaySignature
            ? [
                  message.verified === 1 && 'valid-sig',
                  message.verified !== 1 && 'invalid-sig',
                  internal && 'color-pm-blue', // 'internal',
                  pgpEncrypted && 'pgp'
              ]
            : ['nodecoration color-global-grey flex', internal && 'color-pm-blue'])
    ]);

    return (
        <Tooltip title={tooltip} className="inbl">
            <Href className={className} href={href}>
                <Icon name={icon} />
            </Href>
        </Tooltip>
    );
};

export default MessageLock;
