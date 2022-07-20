import { c } from 'ttag';
import { getEmailMismatchWarning } from '@proton/shared/lib/keys/publicKeys';
import { PublicKeyReference } from '@proton/crypto';

import WarningIcon from './WarningIcon';

interface Props {
    publicKey: PublicKeyReference;
    emailAddress: string;
    isInternal: boolean;
    supportsEncryption?: boolean;
    className?: string;
}
const ContactKeyWarningIcon = ({ publicKey, emailAddress, isInternal, supportsEncryption, className }: Props) => {
    if (!emailAddress) {
        return null;
    }

    const encryptionWarnings =
        supportsEncryption === false ? [c('PGP key encryption warning').t`Key cannot be used for encryption`] : [];

    const emailWarnings = getEmailMismatchWarning(publicKey, emailAddress, isInternal);

    const warnings = encryptionWarnings.concat(emailWarnings);

    if (!warnings.length) {
        return null;
    }

    return <WarningIcon warning={warnings.join(' • ')} className={className} />;
};

export default ContactKeyWarningIcon;
