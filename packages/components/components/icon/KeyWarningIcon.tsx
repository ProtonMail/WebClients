import React from 'react';
import { c } from 'ttag';
import { getEmailMismatchWarning } from '@proton/shared/lib/keys/publicKeys';

import { OpenPGPKey } from 'pmcrypto';
import Icon from './Icon';
import { Tooltip } from '../tooltip';
import { classnames } from '../../helpers';

interface Props {
    publicKey: OpenPGPKey;
    emailAddress: string;
    isInternal: boolean;
    supportsEncryption?: boolean;
    className?: string;
}
const KeyWarningIcon = ({ publicKey, emailAddress, isInternal, supportsEncryption, className }: Props) => {
    if (!emailAddress) {
        return null;
    }
    const icon = <Icon name="attention" className={classnames([className, 'color-warning'])} />;
    const encryptionWarnings =
        supportsEncryption === false ? [c('PGP key encryption warning').t`Key cannot be used for encryption`] : [];

    const emailWarnings = getEmailMismatchWarning(publicKey, emailAddress, isInternal);

    const warnings = encryptionWarnings.concat(emailWarnings);

    if (!warnings.length) {
        return null;
    }

    return <Tooltip title={warnings.join(' • ')}>{icon}</Tooltip>;
};

export default KeyWarningIcon;
