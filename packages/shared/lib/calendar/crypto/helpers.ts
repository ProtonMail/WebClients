import { CryptoProxy, type PrivateKeyReference, type SessionKey } from '@proton/crypto/lib';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { base64StringToUint8Array, uint8ArrayToBase64String } from '../../helpers/encoding';
import type { VerificationPreferences } from '../../interfaces/VerificationPreferences';
import { ATTENDEE_COMMENT_ENCRYPTION_TYPE } from '../constants';

type SignatureContext = 'calendar.sharing.invite' | 'calendar.rsvp.comment';

/**
 * @param eventUID we use the eventUID because it's the same for all events accross attendees, main series and single edits
 */
export function getSignatureContext(context: 'calendar.sharing.invite'): 'calendar.sharing.invite';
export function getSignatureContext<TEventID extends string>(
    context: 'calendar.rsvp.comment',
    eventUID: TEventID
): `calendar.rsvp.comment.${TEventID}`;
export function getSignatureContext(context: SignatureContext, eventUID?: string) {
    switch (context) {
        case 'calendar.sharing.invite':
            return 'calendar.sharing.invite';
        case 'calendar.rsvp.comment':
            return `calendar.rsvp.comment.${eventUID}`;
    }
}

export const getDecryptedRSVPComment = async ({
    eventUID,
    sharedSessionKey,
    encryptedMessage,
    attendeeVerificationPreferences,
}: {
    encryptedMessage: string;
    eventUID: string;
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
                      value: getSignatureContext('calendar.rsvp.comment', eventUID),
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
    eventUID,
    sessionKey,
}: {
    comment: string;
    authorPrivateKey: PrivateKeyReference;
    eventUID: string;
    sessionKey: SessionKey | undefined;
}) => {
    const encryptResult = await CryptoProxy.encryptMessage({
        format: 'binary',
        textData: comment,
        sessionKey,
        signingKeys: [authorPrivateKey],
        signatureContext: {
            value: getSignatureContext('calendar.rsvp.comment', eventUID),
            critical: true,
        },
    });
    const base64EncryptedComment = uint8ArrayToBase64String(encryptResult.message);

    return {
        Message: base64EncryptedComment,
        Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.ENCRYPTED_AND_SIGNED,
    };
};

export const getEncryptedRSVPCommentWithSignature = async ({
    comment,
    signatures,
    sessionKey,
}: {
    comment: string;
    signatures: Uint8Array<ArrayBufferLike>[];
    sessionKey: SessionKey | undefined;
}) => {
    const encryptResult = await CryptoProxy.encryptMessage({
        format: 'binary',
        textData: comment,
        sessionKey,
        binarySignature: mergeUint8Arrays(signatures),
    });
    const base64EncryptedComment = uint8ArrayToBase64String(encryptResult.message);

    return {
        Message: base64EncryptedComment,
        Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.ENCRYPTED_AND_SIGNED,
    };
};
