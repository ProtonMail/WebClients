import { PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { StatusIcon, StatusIconFills } from '../../components/message/EncryptionStatusIcon';
import { SendPreferences } from '../message/sendPreferences';

const { SEND_PM, SEND_EO, SEND_PGP_INLINE, SEND_PGP_MIME } = PACKAGE_TYPE;

const { PLAIN, CHECKMARK, SIGN, WARNING } = StatusIconFills;

export const getStatusIcon = (sendPreferences: SendPreferences): StatusIcon | undefined => {
    const { encrypt, pgpScheme, isPublicKeyPinned, warnings } = sendPreferences;
    if (pgpScheme === SEND_PM) {
        const result = { colorClassName: 'color-pm-blue', isEncrypted: true };
        if (warnings && warnings.length) {
            return { ...result, fill: WARNING, text: warnings[0] };
        }
        if (isPublicKeyPinned) {
            return { ...result, fill: CHECKMARK, text: 'End-to-end encrypted to verified recipient' };
        }
        return { ...result, fill: PLAIN, text: 'End-to-end encrypted' };
    }
    if (pgpScheme === SEND_EO) {
        return { colorClassName: 'color-pm-blue', isEncrypted: true, fill: PLAIN, text: 'End-to-end encrypted' };
    }
    if ([SEND_PGP_INLINE, SEND_PGP_MIME].includes(pgpScheme)) {
        // sign must be true to fall in here
        const result = { colorClassName: 'color-global-success', isEncrypted: encrypt };
        if (warnings && warnings.length) {
            return { ...result, fill: WARNING, text: warnings[0] };
        }
        if (isPublicKeyPinned) {
            return { ...result, fill: CHECKMARK, text: 'PGP-encrypted to verified recipient' };
        }
        if (encrypt) {
            return { ...result, fill: SIGN, text: 'PGP-encrypted and signed' };
        }
        return { ...result, fill: SIGN, text: 'PGP-signed' };
    }
    return undefined;
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
    return '';
};

export const getStatusIconHref = ({ isEncrypted, fill }: Pick<Partial<StatusIcon>, 'isEncrypted' | 'fill'>) => {
    if (fill === CHECKMARK || fill === WARNING) {
        return 'https://protonmail.com/support/knowledge-base/digital-signature/';
    }
    if (isEncrypted) {
        return 'https://protonmail.com/support/knowledge-base/how-to-use-pgp';
    }
    return 'https://protonmail.com/support/knowledge-base/what-is-encrypted/';
};
