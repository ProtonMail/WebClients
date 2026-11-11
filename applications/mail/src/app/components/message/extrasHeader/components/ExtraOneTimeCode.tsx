import { useMemo } from 'react';

import OneTimeCodeDetector from '@proton/mail-message/helpers/message/otp/OneTimeCodeDetector';
import { getOtpGate } from '@proton/mail-message/helpers/message/otp/shouldRunOtpExtraction';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { isThirdPartyRegistration } from '@proton/shared/lib/mail/messages';

import OneTimeCodeCopyButton from '../../../onetimecode/OneTimeCodeCopyButton';
import { OneTimeCodeLocation } from '../../../onetimecode/oneTimeCodeEvents';
import { useOneTimeCodeCopy } from '../../../onetimecode/useOneTimeCodeCopy';
import { useReportOneTimeCodeOutcome } from '../../../onetimecode/useReportOneTimeCodeOutcome';

interface Props {
    message: MessageState;
}

const ExtraOneTimeCode = ({ message }: Props) => {
    const { movesToTrash, onCopy } = useOneTimeCodeCopy();
    const subject = message.data?.Subject || '';
    const sender = message.data?.Sender?.Address;
    const mimeType = (message.data?.MIMEType as MIME_TYPES | undefined) ?? MIME_TYPES.DEFAULT;
    const timestamp = message.data?.Time ?? 0;
    const decryptedBody = message.decryption?.decryptedBody;
    const body = decryptedBody ?? '';
    const thirdPartyRegistration = isThirdPartyRegistration(message.data);

    const { code, source, gateSource } = useMemo(() => {
        // Gate on metadata (subject + sender + recency + third-party registration flag) before touching the body.
        // `timestamp` is epoch seconds; the recency check works in milliseconds.
        const gate = getOtpGate(
            { subject, sender, isThirdPartyRegistration: thirdPartyRegistration },
            timestamp * 1000
        );
        if (!gate) {
            return { code: null, source: null, gateSource: null };
        }
        return { ...OneTimeCodeDetector.extract({ subject, body, mimeType, timestamp }), gateSource: gate };
    }, [subject, sender, body, mimeType, timestamp, thirdPartyRegistration]);

    useReportOneTimeCodeOutcome(
        gateSource && message.data && decryptedBody !== undefined
            ? {
                  location: OneTimeCodeLocation.MESSAGE,
                  emailID: message.data.ID,
                  gateSource,
                  codeSource: source,
              }
            : null
    );

    if (!code || !gateSource || !message.data) {
        return null;
    }

    const { data } = message;

    return (
        <OneTimeCodeCopyButton
            code={code}
            size="medium"
            movesToTrash={movesToTrash}
            onCopy={() => {
                onCopy([data], OneTimeCodeLocation.MESSAGE, gateSource);
            }}
        />
    );
};

export default ExtraOneTimeCode;
