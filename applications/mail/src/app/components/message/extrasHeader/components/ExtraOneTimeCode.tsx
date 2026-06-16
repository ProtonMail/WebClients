import { useMemo } from 'react';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';

import OneTimeCodeDetector from 'proton-mail/helpers/message/otp/OneTimeCodeDetector';

import OneTimeCodeCopyButton from '../../../onetimecode/OneTimeCodeCopyButton';
import { useOneTimeCodeCopy } from '../../../onetimecode/useOneTimeCodeCopy';

interface Props {
    message: MessageState;
}

const ExtraOneTimeCode = ({ message }: Props) => {
    const { movesToTrash, onCopy } = useOneTimeCodeCopy();
    const subject = message.data?.Subject || '';
    const mimeType = (message.data?.MIMEType as MIME_TYPES | undefined) ?? MIME_TYPES.DEFAULT;
    const timestamp = message.data?.Time ?? 0;
    const body = message.decryption?.decryptedBody ?? '';

    const { code } = useMemo(
        () => OneTimeCodeDetector.extract({ subject, body, mimeType, timestamp }),
        [subject, body, mimeType, timestamp]
    );

    if (!code || !message.data) {
        return null;
    }

    const { data } = message;

    return (
        <OneTimeCodeCopyButton code={code} size="medium" movesToTrash={movesToTrash} onCopy={() => onCopy([data])} />
    );
};

export default ExtraOneTimeCode;
