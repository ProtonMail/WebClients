import { useMemo } from 'react';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';

import OneTimeCodeDetector from 'proton-mail/helpers/message/otp/OneTimeCodeDetector';
import { shouldRunOtpExtraction } from 'proton-mail/helpers/message/otp/shouldRunOtpExtraction';

import OneTimeCodeCopyButton from '../../../onetimecode/OneTimeCodeCopyButton';
import { useOneTimeCodeCopy } from '../../../onetimecode/useOneTimeCodeCopy';

interface Props {
    message: MessageState;
}

const ExtraOneTimeCode = ({ message }: Props) => {
    const { movesToTrash, onCopy } = useOneTimeCodeCopy();
    const subject = message.data?.Subject || '';
    const sender = message.data?.Sender?.Address;
    const mimeType = (message.data?.MIMEType as MIME_TYPES | undefined) ?? MIME_TYPES.DEFAULT;
    const timestamp = message.data?.Time ?? 0;
    const body = message.decryption?.decryptedBody ?? '';

    const { code } = useMemo(() => {
        // Gate on metadata (subject + sender + recency) before touching the body.
        // `timestamp` is epoch seconds; the recency check works in milliseconds.
        if (!shouldRunOtpExtraction({ subject, sender, timestampMs: timestamp * 1000 })) {
            return { code: null };
        }
        return OneTimeCodeDetector.extract({ subject, body, mimeType, timestamp });
    }, [subject, sender, body, mimeType, timestamp]);

    if (!code || !message.data) {
        return null;
    }

    const { data } = message;

    return (
        <OneTimeCodeCopyButton code={code} size="medium" movesToTrash={movesToTrash} onCopy={() => onCopy([data])} />
    );
};

export default ExtraOneTimeCode;
