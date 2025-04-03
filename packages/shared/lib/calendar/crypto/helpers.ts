import { CryptoProxy, type PrivateKeyReference, type SessionKey } from '@proton/crypto/lib';

import { base64StringToUint8Array, uint8ArrayToBase64String } from '../../helpers/encoding';
import type { VerificationPreferences } from '../../interfaces/VerificationPreferences';
import { ATTENDEE_COMMENT_ENCRYPTION_TYPE } from '../constants';

type SignatureContext = 'calendar.sharing.invite' | 'calendar.rsvp.comment';

export function getSignatureContext(context: 'calendar.sharing.invite'): 'calendar.sharing.invite';
export function getSignatureContext<TEventID extends string>(
    context: 'calendar.rsvp.comment',
    sharedEventID: TEventID
): `calendar.rsvp.comment.${TEventID}`;
export function getSignatureContext(context: SignatureContext, eventID?: string) {
    switch (context) {
        case 'calendar.sharing.invite':
            return 'calendar.sharing.invite';
        case 'calendar.rsvp.comment':
            return `calendar.rsvp.comment.${eventID}`;
    }
}

export const getDecryptedRSVPComment = async ({
    sharedEventID,
    sharedSessionKey,
    encryptedMessage,
    attendeeVerificationPreferences,
}: {
    encryptedMessage: string;
    sharedEventID: string;
    sharedSessionKey: SessionKey;
    attendeeVerificationPreferences: VerificationPreferences;
}) => {
    const binaryMessage = base64StringToUint8Array(encryptedMessage);
    const decryptedMessageResult = await CryptoProxy.decryptMessage({
        sessionKeys: [sharedSessionKey],
        binaryMessage,
        ...(attendeeVerificationPreferences.verifyingKeys.length
            ? {
                  verificationKeys: attendeeVerificationPreferences.verifyingKeys,
                  signatureContext: {
                      value: getSignatureContext('calendar.rsvp.comment', sharedEventID),
                      required: true,
                  },
              }
            : {}),
    });

    return decryptedMessageResult;
};

export const getEncryptedRSVPComment = async ({
    comment,
    authorPrivateKey,
    sharedEventID,
    sessionKey,
}: {
    comment: string;
    authorPrivateKey: PrivateKeyReference;
    sharedEventID: string;
    sessionKey: SessionKey | undefined;
}) => {
    const encryptResult = await CryptoProxy.encryptMessage({
        format: 'binary',
        textData: comment,
        sessionKey,
        signingKeys: [authorPrivateKey],
        signatureContext: {
            value: getSignatureContext('calendar.rsvp.comment', sharedEventID),
            critical: true,
        },
    });
    const base64EncryptedComment = uint8ArrayToBase64String(encryptResult.message);

    return {
        Message: base64EncryptedComment,
        Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.ENCRYPTED_AND_SIGNED,
    };
};
