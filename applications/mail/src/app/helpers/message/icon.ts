import { PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { c, msgid } from 'ttag';
import { VERIFICATION_STATUS } from '../../constants';
import { MapStatusIcons, SendPreferences, STATUS_ICONS_FILLS, StatusIcon, X_PM_HEADERS } from '../../models/crypto';
import { MessageExtended } from '../../models/message';
import { inSigningPeriod } from './messages';

// The logic for determining the status icons can be found here:
// https://confluence.protontech.ch/display/MAILFE/Encryption+status+for+outgoing+and+incoming+email

const { SEND_PM, SEND_EO, SEND_PGP_INLINE, SEND_PGP_MIME } = PACKAGE_TYPE;
const { NOT_SIGNED, SIGNED_AND_INVALID, SIGNED_AND_VALID } = VERIFICATION_STATUS;
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
    ON_DELIVERY
} = X_PM_HEADERS;

export interface MessageViewIcons {
    globalIcon?: StatusIcon;
    mapStatusIcon?: MapStatusIcons;
}

const getMapEmailHeaders = (headers: string): { [key: string]: X_PM_HEADERS } => {
    const splitHeaders = headers.split(';').map((str) => str.replace('%40', '@').trim());
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
    const { encrypt, pgpScheme, hasApiKeys, isPublicKeyPinned, warnings, failure } = sendPreferences;
    const warningsText = warnings?.join('; ');
    if (failure) {
        return { colorClassName: 'color-global-warning', isEncrypted: false, fill: FAIL, text: failure.error.message };
    }
    if (pgpScheme === SEND_PM) {
        const result = { colorClassName: 'color-pm-blue', isEncrypted: true };
        if (warningsText) {
            return { ...result, fill: WARNING, text: warningsText };
        }
        if (isPublicKeyPinned) {
            return {
                ...result,
                fill: CHECKMARK,
                text: c('Composer email icon').t`End-to-end encrypted to verified recipient`
            };
        }
        return { ...result, fill: PLAIN, text: c('Composer email icon').t`End-to-end encrypted` };
    }
    if (pgpScheme === SEND_EO) {
        return {
            colorClassName: 'color-pm-blue',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Composer email icon').t`End-to-end encrypted`
        };
    }
    if ([SEND_PGP_INLINE, SEND_PGP_MIME].includes(pgpScheme)) {
        // sign must be true to fall in here
        const result = { colorClassName: 'color-global-success', isEncrypted: encrypt };
        if (warningsText) {
            return { ...result, fill: WARNING, text: warningsText };
        }
        if (encrypt) {
            if (isPublicKeyPinned) {
                if (hasApiKeys) {
                    return {
                        ...result,
                        fill: CHECKMARK,
                        text: c('Composer email icon').t`End-to-end encrypted to verified recipient`
                    };
                }
                return {
                    ...result,
                    fill: CHECKMARK,
                    text: c('Composer email icon').t`PGP-encrypted to verified recipient`
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
    emailAddress?: string;
}

export const getSentStatusIcon = ({
    mapAuthentication,
    mapEncryption,
    emailAddress
}: Params): StatusIcon | undefined => {
    if (!emailAddress) {
        // we return the aggregated send icon in this case
        const encryptions = Object.values(mapEncryption);
        if (!encryptions.length) {
            return;
        }
        const allPinned = encryptions.every((encryption) =>
            [PGP_PM_PINNED, PGP_MIME_PINNED, PGP_INLINE_PINNED].includes(encryption)
        );
        const allEncrypted = !encryptions.some((encryption) => encryption === NONE);
        if (allPinned) {
            return {
                colorClassName: 'color-global-blue',
                isEncrypted: true,
                fill: CHECKMARK,
                text: c('Sent email icon').ngettext(
                    msgid`Sent by you with end-to-end encryption to verified recipient`,
                    `Sent by you with end-to-end encryption to verified recipients`,
                    encryptions.length
                )
            };
        }
        if (allEncrypted) {
            return {
                colorClassName: 'color-global-blue',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        return {
            colorClassName: 'color-global-grey',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Sent email icon').t`Stored with zero-access encryption`
        };
    }

    const [authentication, encryption] = [mapAuthentication[emailAddress], mapEncryption[emailAddress]];

    if (authentication === NONE) {
        if (encryption !== NONE) {
            return;
        }
        return {
            colorClassName: 'color-global-grey',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Sent email icon').t`Stored with zero-access encryption`
        };
    }
    if (authentication === PGP_INLINE) {
        if (encryption === NONE) {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: false,
                fill: SIGN,
                text: c('Sent email icon').t`Sent by you with authentication`
            };
        }
        if (encryption === PGP_INLINE) {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        if (encryption === PGP_INLINE_PINNED) {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: CHECKMARK,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption to verified recipient`
            };
        }
    }
    if (authentication === PGP_MIME) {
        if (encryption === NONE) {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: false,
                fill: SIGN,
                text: c('Sent email icon').t`Sent by you with authentication`
            };
        }
        if (encryption === PGP_MIME) {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        if (encryption === PGP_MIME_PINNED) {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: CHECKMARK,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption to verified recipient`
            };
        }
        return;
    }
    if (authentication === PGP_EO) {
        if (encryption !== PGP_EO) {
            return;
        }
        return {
            colorClassName: 'color-pm-blue',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Sent email icon').t`Sent by you with end-to-end encryption`
        };
    }
    if (authentication === PGP_PM) {
        if (encryption === PGP_PM) {
            return {
                colorClassName: 'color-pm-blue',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        if (encryption === PGP_PM_PINNED) {
            return {
                colorClassName: 'color-pm-blue',
                isEncrypted: true,
                fill: CHECKMARK,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption to verified recipient`
            };
        }
    }
    return {
        colorClassName: 'color-global-grey',
        isEncrypted: true,
        fill: PLAIN,
        text: c('Sent email icon').t`Stored with zero-access encryption`
    };
};

export const getSentStatusIconInfo = (message: MessageExtended): MessageViewIcons | undefined => {
    if (!message.data?.ParsedHeaders) {
        return;
    }
    const mapAuthentication = getMapEmailHeaders(message.data.ParsedHeaders['X-Pm-Recipient-Authentication']);
    const mapEncryption = getMapEmailHeaders(message.data.ParsedHeaders['X-Pm-Recipient-Encryption']);
    const globalIcon = getSentStatusIcon({ mapAuthentication, mapEncryption });
    const mapStatusIcon = Object.keys(mapAuthentication).reduce<MapStatusIcons>((acc, emailAddress) => {
        acc[emailAddress] = getSentStatusIcon({ mapAuthentication, mapEncryption, emailAddress });
        return acc;
    }, {});
    return { globalIcon, mapStatusIcon };
};

export const getReceivedStatusIcon = (message: MessageExtended): StatusIcon | undefined => {
    if (!message.data?.ParsedHeaders || message.verificationStatus === undefined) {
        return;
    }
    const origin = message.data.ParsedHeaders['X-Pm-Origin'];
    const encryption = message.data.ParsedHeaders['X-Pm-Content-Encryption'];
    const { verificationStatus } = message;
    const hasPinnedKeys = !!message.senderPinnedKeys?.length;

    if (origin === INTERNAL) {
        const result = { colorClassName: 'color-pm-blue', isEncrypted: true };
        if (encryption === END_TO_END) {
            const verificationErrorsmessage = message.verificationErrors
                ?.map(({ message }) => message)
                .filter(Boolean)
                .join('; ');
            const warningsText = (() => {
                const expectSigned = inSigningPeriod(message.data) || hasPinnedKeys;
                if (verificationStatus === NOT_SIGNED && expectSigned) {
                    return c('Signature verification warning').t`Sender could not be verified: Message not signed`;
                }
                if (verificationErrorsmessage) {
                    return c('Signature verification warning')
                        .t`Sender verification failed: ${verificationErrorsmessage}`;
                }
                return undefined;
            })();

            if (warningsText) {
                return { ...result, fill: WARNING, text: warningsText };
            }
            if (verificationStatus === SIGNED_AND_INVALID) {
                if (hasPinnedKeys) {
                    return {
                        ...result,
                        fill: WARNING,
                        text: c('Signature verification warning').t`Sender verification failed`
                    };
                }
                return {
                    ...result,
                    fill: PLAIN,
                    text: c('Received email icon').t`End-to-end encrypted and signed message`
                };
            }
            if (verificationStatus === SIGNED_AND_VALID) {
                if (hasPinnedKeys) {
                    return {
                        ...result,
                        fill: CHECKMARK,
                        text: c('Received email icon').t`End-to-end encrypted message from verified sender`
                    };
                }
                return {
                    ...result,
                    fill: PLAIN,
                    text: c('Received email icon').t`End-to-end encrypted and signed message`
                };
            }
            return { ...result, fill: PLAIN, text: c('Received email icon').t`End-to-end encrypted message` };
        }
        if (encryption === ON_DELIVERY) {
            return {
                ...result,
                fill: PLAIN,
                text: c('Received email icon').t`Sent by Protonmail with zero-access encryption`
            };
        }
    }

    if (origin === EXTERNAL) {
        if (encryption === END_TO_END) {
            const result = { colorClassName: 'color-global-success', isEncrypted: true };
            const verificationErrorsmessage = message.verificationErrors
                ?.map(({ message }) => message)
                .filter(Boolean)
                .join('; ');
            const warningsText = verificationErrorsmessage
                ? c('Signature verification warning')
                      .t`PGP-encrypted message. Sender verification failed: ${verificationErrorsmessage}`
                : undefined;

            if (warningsText) {
                return { ...result, fill: WARNING, text: warningsText };
            }
            if (verificationStatus === SIGNED_AND_INVALID) {
                return {
                    ...result,
                    fill: WARNING,
                    text: c('Signature verification warning').t`Sender verification failed`
                };
            }
            if (verificationStatus === SIGNED_AND_VALID) {
                if (hasPinnedKeys) {
                    return {
                        ...result,
                        fill: CHECKMARK,
                        text: c('Received email icon').t`PGP-encrypted message from verified sender`
                    };
                }
                return {
                    ...result,
                    fill: PLAIN,
                    text: c('Received email icon').t`PGP-encrypted and signed message`
                };
            }
            return { ...result, fill: PLAIN, text: c('Received email icon').t`PGP-encrypted message` };
        }
        if (encryption === ON_DELIVERY) {
            if (verificationStatus === NOT_SIGNED) {
                return {
                    colorClassName: 'color-global-grey',
                    isEncrypted: false,
                    fill: PLAIN,
                    text: c('Received email icon').t`Stored with zero-access encryption`
                };
            }

            const result = { colorClassName: 'color-global-success', isEncrypted: false };
            const verificationErrorsmessage = message.verificationErrors
                ?.map(({ message }) => message)
                .filter(Boolean)
                .join('; ');
            const warningsText = verificationErrorsmessage
                ? c('Signature verification warning')
                      .t`PGP-signed message. Sender verification failed: ${verificationErrorsmessage}`
                : undefined;

            if (warningsText) {
                return { ...result, fill: WARNING, text: warningsText };
            }
            if (verificationStatus === SIGNED_AND_VALID) {
                if (hasPinnedKeys) {
                    return {
                        ...result,
                        fill: CHECKMARK,
                        text: c('Received email icon').t`PGP-signed message from verified sender`
                    };
                }
                return {
                    ...result,
                    fill: SIGN,
                    text: c('Received email icon').t`PGP-signed message`
                };
            }
        }
    }

    return {
        colorClassName: 'color-global-grey',
        isEncrypted: false,
        fill: PLAIN,
        text: c('Received email icon').t`Stored with zero-access encryption`
    };
};

export const getStatusIconName = ({ isEncrypted, fill }: Pick<Partial<StatusIcon>, 'isEncrypted' | 'fill'>) => {
    if (fill === PLAIN) {
        return 'locks-closed';
    }
    if (fill === CHECKMARK) {
        return 'locks-check';
    }
    if (fill === SIGN) {
        return isEncrypted ? 'locks-signed' : 'locks-open-signed';
    }
    if (fill === WARNING) {
        return 'locks-warning';
    }
    if (fill === FAIL) {
        return 'circle';
    }
    return '';
};

export const getSendIconHref = ({ isEncrypted, fill }: Pick<Partial<StatusIcon>, 'isEncrypted' | 'fill'>) => {
    if (fill === CHECKMARK || fill === WARNING) {
        return 'https://protonmail.com/support/knowledge-base/digital-signature/';
    }
    if (isEncrypted) {
        return 'https://protonmail.com/support/knowledge-base/how-to-use-pgp';
    }
    return 'https://protonmail.com/support/knowledge-base/what-is-encrypted/';
};
