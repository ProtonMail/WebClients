import { PACKAGE_TYPE } from '@proton/shared/lib/constants';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getParsedHeadersFirstValue, inSigningPeriod } from '@proton/shared/lib/mail/messages';
import { c, msgid } from 'ttag';
import { MessageState, MessageVerification } from '../../logic/messages/messagesTypes';
import { MapStatusIcons, STATUS_ICONS_FILLS, StatusIcon, X_PM_HEADERS } from '../../models/crypto';

// The logic for determining the status icons can be found here:
// https://confluence.protontech.ch/display/MAILFE/Encryption+status+for+outgoing+and+incoming+email

const { SEND_PM, SEND_EO, SEND_PGP_INLINE, SEND_PGP_MIME } = PACKAGE_TYPE;
const { NOT_VERIFIED, NOT_SIGNED, SIGNED_AND_INVALID, SIGNED_AND_VALID } = VERIFICATION_STATUS;
const { PLAIN, CHECKMARK, SIGN, WARNING, FAIL } = STATUS_ICONS_FILLS;
const {
    NONE,
    PGP_INLINE,
    PGP_INLINE_PINNED,
    PGP_MIME,
    PGP_MIME_PINNED,
    PGP_PM,
    PGP_PM_PINNED,
    PGP_EO,
    INTERNAL,
    EXTERNAL,
    END_TO_END,
    ON_COMPOSE,
    ON_DELIVERY,
} = X_PM_HEADERS;

export interface MessageViewIcons {
    globalIcon?: StatusIcon;
    mapStatusIcon: MapStatusIcons;
}

const getMapEmailHeaders = (headers?: string): { [key: string]: X_PM_HEADERS } => {
    if (!headers) {
        return {};
    }
    const splitHeaders = headers.split(';').map((str) => decodeURIComponent(str.trim()));
    return splitHeaders.reduce<{ [key: string]: X_PM_HEADERS }>((acc, header) => {
        const match = header.match(/(.*)=(.*)/);
        if (!match) {
            return acc;
        }
        const [, emailAddress, emailHeader] = match;
        acc[emailAddress] = emailHeader as X_PM_HEADERS;
        return acc;
    }, {});
};

export const getSendStatusIcon = (sendPreferences: SendPreferences): StatusIcon | undefined => {
    const { encrypt, pgpScheme, hasApiKeys, isPublicKeyPinned, warnings, error } = sendPreferences;
    const validationErrorsMessage = warnings?.join('; ');
    const warningsText = validationErrorsMessage
        ? c('Key validation warning').t`Recipient's key validation failed: ${validationErrorsMessage}`
        : undefined;
    if (error) {
        return { colorClassName: 'color-danger', isEncrypted: false, fill: FAIL, text: error.message };
    }
    if (pgpScheme === SEND_PM) {
        const result = { colorClassName: 'color-info', isEncrypted: true };
        if (isPublicKeyPinned) {
            return {
                ...result,
                fill: CHECKMARK,
                text: c('Composer email icon').t`End-to-end encrypted to verified recipient`,
            };
        }
        return { ...result, fill: PLAIN, text: c('Composer email icon').t`End-to-end encrypted` };
    }
    if (pgpScheme === SEND_EO) {
        return {
            colorClassName: 'color-info',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Composer email icon').t`End-to-end encrypted`,
        };
    }
    if ([SEND_PGP_INLINE, SEND_PGP_MIME].includes(pgpScheme)) {
        // sign must be true to fall in here
        const result = { colorClassName: 'color-success', isEncrypted: encrypt };
        if (warningsText) {
            if (hasApiKeys) {
                return {
                    ...result,
                    fill: WARNING,
                    text: c('Composer email icon').t`End-to-end encrypted. ${warningsText}`,
                };
            }
            return {
                ...result,
                fill: WARNING,
                text: c('Composer email icon').t`PGP-encrypted. ${warningsText}`,
            };
        }
        if (encrypt) {
            if (isPublicKeyPinned) {
                if (hasApiKeys) {
                    return {
                        ...result,
                        fill: CHECKMARK,
                        text: c('Composer email icon').t`End-to-end encrypted to verified recipient`,
                    };
                }
                return {
                    ...result,
                    fill: CHECKMARK,
                    text: c('Composer email icon').t`PGP-encrypted to verified recipient`,
                };
            }
            if (hasApiKeys) {
                return { ...result, fill: PLAIN, text: c('Composer email icon').t`End-to-end encrypted` };
            }
            return { ...result, fill: SIGN, text: c('Composer email icon').t`PGP-encrypted` };
        }
        return { ...result, fill: SIGN, text: c('Composer email icon').t`PGP-signed` };
    }
};

interface Params {
    mapAuthentication: { [key: string]: X_PM_HEADERS };
    mapEncryption: { [key: string]: X_PM_HEADERS };
    contentEncryption: X_PM_HEADERS;
    emailAddress?: string;
}

export const getSentStatusIcon = ({
    mapAuthentication,
    mapEncryption,
    contentEncryption,
    emailAddress,
}: Params): StatusIcon | undefined => {
    if (!emailAddress) {
        // we return the aggregated send icon in this case
        const encryptions = Object.values(mapEncryption);
        const hasHeaderInfo = !!encryptions.length;
        const allExternal =
            hasHeaderInfo && !encryptions.some((encryption) => [PGP_PM, PGP_PM_PINNED, PGP_EO].includes(encryption));
        const allPinned =
            hasHeaderInfo &&
            !encryptions.some(
                (encryption) => ![PGP_PM_PINNED, PGP_MIME_PINNED, PGP_INLINE_PINNED].includes(encryption)
            );
        const allEncrypted = hasHeaderInfo && !encryptions.some((encryption) => encryption === NONE);
        if (allPinned) {
            const text =
                contentEncryption === END_TO_END
                    ? c('Sent email icon').ngettext(
                          msgid`Sent by you with end-to-end encryption to verified recipient`,
                          `Sent by you with end-to-end encryption to verified recipients`,
                          encryptions.length
                      )
                    : c('Sent email icon').ngettext(
                          msgid`Sent by ProtonMail with zero-access encryption to verified recipient`,
                          `Sent by ProtonMail with zero-access encryption to verified recipients`,
                          encryptions.length
                      );
            return {
                colorClassName: allExternal ? 'color-success' : 'color-info',
                isEncrypted: true,
                fill: CHECKMARK,
                text,
            };
        }
        if (allEncrypted) {
            return {
                colorClassName: allExternal ? 'color-success' : 'color-info',
                isEncrypted: true,
                fill: PLAIN,
                text:
                    contentEncryption === END_TO_END
                        ? c('Sent email icon').t`Sent by you with end-to-end encryption`
                        : c('Sent email icon').t`Sent by ProtonMail with zero-access encryption`,
            };
        }
        return {
            colorClassName: 'color-info',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Sent email icon').t`Stored with zero-access encryption`,
        };
    }

    const [authentication, encryption] = [mapAuthentication[emailAddress], mapEncryption[emailAddress]];
    if (encryption === NONE && [PGP_INLINE, PGP_MIME].includes(authentication)) {
        if (contentEncryption !== ON_COMPOSE) {
            return;
        }
        return {
            colorClassName: 'color-success',
            isEncrypted: false,
            fill: SIGN,
            text: c('Sent email icon').t`PGP-signed`,
        };
    }
    if ([PGP_INLINE, PGP_MIME].includes(encryption) && [NONE, PGP_INLINE, PGP_MIME].includes(authentication)) {
        return {
            colorClassName: 'color-success',
            isEncrypted: true,
            fill: PLAIN,
            text:
                contentEncryption === END_TO_END
                    ? c('Sent email icon').t`End-to-end encrypted to PGP recipient`
                    : c('Sent email icon').t`Encrypted by ProtonMail to PGP recipient`,
        };
    }
    if (
        [PGP_INLINE_PINNED, PGP_MIME_PINNED].includes(encryption) &&
        [NONE, PGP_INLINE, PGP_MIME].includes(authentication)
    ) {
        return {
            colorClassName: 'color-success',
            isEncrypted: true,
            fill: CHECKMARK,
            text:
                contentEncryption === END_TO_END
                    ? c('Sent email icon').t`End-to-end encrypted to verified PGP recipient`
                    : c('Sent email icon').t`Encrypted by ProtonMail to verified PGP recipient`,
        };
    }
    if (authentication === PGP_EO && encryption === PGP_EO) {
        return {
            colorClassName: 'color-info',
            isEncrypted: true,
            fill: PLAIN,
            text:
                contentEncryption === END_TO_END
                    ? c('Sent email icon').t`End-to-end encrypted`
                    : c('Sent email icon').t`Encrypted by ProtonMail`,
        };
    }
    if (encryption === PGP_PM && [NONE, PGP_PM].includes(authentication)) {
        return {
            colorClassName: 'color-info',
            isEncrypted: true,
            fill: PLAIN,
            text:
                contentEncryption === END_TO_END
                    ? c('Sent email icon').t`End-to-end encrypted`
                    : c('Sent email icon').t`Encrypted by ProtonMail`,
        };
    }
    if (encryption === PGP_PM_PINNED && [NONE, PGP_PM].includes(authentication)) {
        return {
            colorClassName: 'color-info',
            isEncrypted: true,
            fill: CHECKMARK,
            text:
                contentEncryption === END_TO_END
                    ? c('Sent email icon').t`End-to-end encrypted to verified recipient`
                    : c('Sent email icon').t`Encrypted by ProtonMail to verified recipient`,
        };
    }
};

export const getSentStatusIconInfo = (message: MessageState): MessageViewIcons => {
    if (!message.data?.ParsedHeaders) {
        return { mapStatusIcon: {} };
    }
    const mapAuthentication = getMapEmailHeaders(
        getParsedHeadersFirstValue(message.data, 'X-Pm-Recipient-Authentication')
    );
    const mapEncryption = getMapEmailHeaders(getParsedHeadersFirstValue(message.data, 'X-Pm-Recipient-Encryption'));
    const contentEncryption = getParsedHeadersFirstValue(message.data, 'X-Pm-Content-Encryption') as X_PM_HEADERS;
    const globalIcon = getSentStatusIcon({ mapAuthentication, mapEncryption, contentEncryption });
    const mapStatusIcon = Object.keys(mapAuthentication).reduce<MapStatusIcons>((acc, emailAddress) => {
        acc[emailAddress] = getSentStatusIcon({ mapAuthentication, mapEncryption, contentEncryption, emailAddress });
        return acc;
    }, {});
    return { globalIcon, mapStatusIcon };
};

export const getReceivedStatusIcon = (
    message: Message | undefined,
    verification: MessageVerification | undefined
): StatusIcon | undefined => {
    if (!message?.ParsedHeaders || verification?.verificationStatus === undefined) {
        return;
    }
    const origin = message.ParsedHeaders['X-Pm-Origin'];
    const encryption = message.ParsedHeaders['X-Pm-Content-Encryption'];
    const { verificationStatus, senderVerified, senderPinnedKeys } = verification;
    const hasPinnedKeys = !!senderPinnedKeys?.length;

    if (origin === INTERNAL) {
        const result = { colorClassName: 'color-info', isEncrypted: true };
        if (encryption === END_TO_END) {
            const verificationErrorsMessage = verification.verificationErrors
                ?.map(({ message }) => message)
                .filter(Boolean)
                .join('; ');
            const warningsText = (() => {
                const expectSigned = inSigningPeriod(message) || hasPinnedKeys;
                if (verificationStatus === NOT_SIGNED && expectSigned) {
                    return c('Signature verification warning').t`Sender could not be verified: Message not signed`;
                }
                if (verificationErrorsMessage) {
                    return c('Signature verification warning')
                        .t`Sender verification failed: ${verificationErrorsMessage}`;
                }
                return undefined;
            })();

            if (warningsText) {
                return { ...result, fill: WARNING, text: warningsText };
            }
            if (verificationStatus === NOT_SIGNED) {
                return {
                    ...result,
                    fill: PLAIN,
                    text: c('Received email icon').t`End-to-end encrypted message`,
                };
            }
            if (verificationStatus === NOT_VERIFIED) {
                return {
                    ...result,
                    fill: PLAIN,
                    text: c('Received email icon').t`End-to-end encrypted and signed message`,
                };
            }
            if (verificationStatus === SIGNED_AND_INVALID) {
                return {
                    ...result,
                    fill: WARNING,
                    text: c('Signature verification warning').t`Sender verification failed`,
                };
            }
            if (verificationStatus === SIGNED_AND_VALID) {
                if (!senderVerified) {
                    return {
                        ...result,
                        fill: WARNING,
                        text: c('Signature verification warning').t`Sender's trusted keys verification failed`,
                    };
                }
                return {
                    ...result,
                    fill: CHECKMARK,
                    text: c('Received email icon').t`End-to-end encrypted message from verified sender`,
                };
            }
            return { ...result, fill: PLAIN, text: c('Received email icon').t`End-to-end encrypted message` };
        }
        if (encryption === ON_DELIVERY) {
            return {
                ...result,
                fill: PLAIN,
                text: c('Received email icon').t`Sent by ProtonMail with zero-access encryption`,
            };
        }
    }

    if (origin === EXTERNAL) {
        if (encryption === END_TO_END) {
            const result = { colorClassName: 'color-success', isEncrypted: true };
            const verificationErrorsMessage = verification.verificationErrors
                ?.map(({ message }) => message)
                .filter(Boolean)
                .join('; ');
            const warningsText = verificationErrorsMessage
                ? c('Signature verification warning')
                      .t`PGP-encrypted message. Sender verification failed: ${verificationErrorsMessage}`
                : undefined;

            if (warningsText) {
                return { ...result, fill: WARNING, text: warningsText };
            }
            if (verificationStatus === NOT_SIGNED) {
                return {
                    ...result,
                    fill: PLAIN,
                    text: c('Received email icon').t`PGP-encrypted message`,
                };
            }
            if (verificationStatus === NOT_VERIFIED) {
                return {
                    ...result,
                    fill: SIGN,
                    text: c('Received email icon').t`PGP-encrypted and signed message`,
                };
            }
            if (verificationStatus === SIGNED_AND_INVALID) {
                return {
                    ...result,
                    fill: WARNING,
                    text: c('Signature verification warning').t`Sender verification failed`,
                };
            }
            if (verificationStatus === SIGNED_AND_VALID) {
                if (!senderVerified) {
                    return {
                        ...result,
                        fill: WARNING,
                        text: c('Signature verification warning').t`Sender's trusted keys verification failed`,
                    };
                }
                return {
                    ...result,
                    fill: CHECKMARK,
                    text: c('Received email icon').t`PGP-encrypted message from verified sender`,
                };
            }
            return { ...result, fill: PLAIN, text: c('Received email icon').t`PGP-encrypted message` };
        }
        if (encryption === ON_DELIVERY) {
            if (verificationStatus === NOT_SIGNED) {
                return {
                    colorClassName: 'color-norm',
                    isEncrypted: false,
                    fill: PLAIN,
                    text: c('Received email icon').t`Stored with zero-access encryption`,
                };
            }

            const result = { colorClassName: 'color-success', isEncrypted: false };
            const verificationErrorsMessage = verification.verificationErrors
                ?.map(({ message }) => message)
                .filter(Boolean)
                .join('; ');
            const warningsText = verificationErrorsMessage
                ? c('Signature verification warning')
                      .t`PGP-signed message. Sender verification failed: ${verificationErrorsMessage}`
                : undefined;

            if (warningsText) {
                return { ...result, fill: WARNING, text: warningsText };
            }
            if (verificationStatus === NOT_VERIFIED) {
                return {
                    ...result,
                    fill: SIGN,
                    text: c('Received email icon').t`PGP-signed message`,
                };
            }
            if (verificationStatus === SIGNED_AND_VALID) {
                if (!senderVerified) {
                    return {
                        ...result,
                        fill: WARNING,
                        text: c('Signature verification warning').t`Sender's trusted keys verification failed`,
                    };
                }
                return {
                    ...result,
                    fill: CHECKMARK,
                    text: c('Received email icon').t`PGP-signed message from verified sender`,
                };
            }
            if (verificationStatus === SIGNED_AND_INVALID) {
                return {
                    ...result,
                    fill: WARNING,
                    text: c('Received email icon').t`PGP-signed message. Sender verification failed`,
                };
            }
        }
    }

    return {
        colorClassName: 'color-norm',
        isEncrypted: false,
        fill: PLAIN,
        text: c('Received email icon').t`Stored with zero-access encryption`,
    };
};

export const getStatusIconName = ({ isEncrypted, fill }: Pick<Partial<StatusIcon>, 'isEncrypted' | 'fill'>) => {
    if (fill === PLAIN) {
        return 'lock-filled';
    }
    if (fill === CHECKMARK) {
        return isEncrypted ? 'lock-check-filled' : 'unlock-check-filled';
    }
    if (fill === SIGN) {
        return isEncrypted ? 'lock-pen-filled' : 'unlock-pen-filled';
    }
    if (fill === WARNING) {
        return isEncrypted ? 'lock-triangle-exclamation-filled' : 'unlock-triangle-exclamation-filled';
    }
    if (fill === FAIL) {
        return 'triangle-exclamation';
    }
    return '';
};

export const getSendIconHref = ({ isEncrypted, fill }: Pick<Partial<StatusIcon>, 'isEncrypted' | 'fill'>) => {
    if (fill === CHECKMARK || fill === WARNING) {
        return 'https://protonmail.com/support/knowledge-base/digital-signature/';
    }
    if (isEncrypted) {
        return undefined;
    }
    return 'https://protonmail.com/support/knowledge-base/what-is-encrypted/';
};
