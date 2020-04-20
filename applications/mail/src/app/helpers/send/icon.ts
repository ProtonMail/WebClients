import { c, msgid } from 'ttag';
import { PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { SendPreferences, StatusIcon, StatusIconFills } from '../../models/crypto';

// The logic for determining the status icons can be found here:
// https://confluence.protontech.ch/display/MAILFE/Encryption+status+for+outgoing+and+incoming+email

const { SEND_PM, SEND_EO, SEND_PGP_INLINE, SEND_PGP_MIME } = PACKAGE_TYPE;

const { PLAIN, CHECKMARK, SIGN, WARNING, FAIL } = StatusIconFills;

export const getSendStatusIcon = (sendPreferences: SendPreferences): StatusIcon | undefined => {
    const { encrypt, pgpScheme, isPublicKeyPinned, warnings, failure } = sendPreferences;
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
        if (isPublicKeyPinned) {
            return {
                ...result,
                fill: CHECKMARK,
                text: c('Composer email icon').t`PGP-encrypted to verified recipient`
            };
        }
        if (encrypt) {
            return { ...result, fill: SIGN, text: c('Composer email icon').t`PGP-encrypted and signed` };
        }
        return { ...result, fill: SIGN, text: c('Composer email icon').t`PGP-signed` };
    }
    return undefined;
};

export const getMapEmailHeaders = (headers: string): { [key: string]: string } => {
    const splitHeaders = headers.split(';').map((str) => str.replace('%40', '@').trim());
    return splitHeaders.reduce<{ [key: string]: string }>((acc, header) => {
        const match = header.match(/(.*)=(.*)/);
        if (!match) {
            return acc;
        }
        const [, emailAddress, emailHeader] = match;
        acc[emailAddress] = emailHeader;
        return acc;
    }, {});
};

interface Params {
    mapAuthentication: { [key: string]: string };
    mapEncryption: { [key: string]: string };
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
            ['pgp-pm-pinned', 'pgp-mime-pinned', 'pgp-inline-pinned'].includes(encryption)
        );
        const allEncrypted = !encryptions.some((encryption) => encryption === 'none');
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
                colorClassName: 'color-global-grey',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        return {
            colorClassName: 'color-global-grey',
            isEncrypted: true,
            fill: PLAIN,
            text: 'Stored with zero-access encryption'
        };
    }

    const [authentication, encryption] = [mapAuthentication[emailAddress], mapEncryption[emailAddress]];

    if (authentication === 'none') {
        if (encryption !== 'none') {
            return;
        }
        return {
            colorClassName: 'color-global-grey',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Sent email icon').t`Stored with zero-access encryption`
        };
    }
    if (authentication === 'pgp-inline') {
        if (encryption === 'none') {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: false,
                fill: SIGN,
                text: c('Sent email icon').t`Sent by you with authentication`
            };
        }
        if (encryption === 'pgp-inline') {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        if (encryption === 'pgp-inline-pinned') {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: CHECKMARK,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption to verified recipient`
            };
        }
    }
    if (authentication === 'pgp-mime') {
        if (encryption === 'none') {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: false,
                fill: SIGN,
                text: c('Sent email icon').t`Sent by you with authentication`
            };
        }
        if (encryption === 'pgp-mime') {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        if (encryption === 'pgp-mime-pinned') {
            return {
                colorClassName: 'color-global-success',
                isEncrypted: true,
                fill: CHECKMARK,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption to verified recipient`
            };
        }
        return;
    }
    if (authentication === 'pgp-eo') {
        if (encryption !== 'pgp-eo') {
            return;
        }
        return {
            colorClassName: 'color-pm-blue',
            isEncrypted: true,
            fill: PLAIN,
            text: c('Sent email icon').t`Sent by you with end-to-end encryption`
        };
    }
    if (authentication === 'pgp-pm') {
        if (encryption === 'pgp-pm') {
            return {
                colorClassName: 'color-pm-blue',
                isEncrypted: true,
                fill: PLAIN,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption`
            };
        }
        if (encryption === 'pgp-pm-pinned') {
            return {
                colorClassName: 'color-pm-blue',
                isEncrypted: true,
                fill: CHECKMARK,
                text: c('Sent email icon').t`Sent by you with end-to-end encryption to verified recipient`
            };
        }
    }
    return;
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
