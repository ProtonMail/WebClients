import React from 'react';
import { classnames, Icon, Tooltip } from '../../index';
import { getEmailMismatchWarning } from 'proton-shared/lib/keys/publicKeys';

import { OpenPGPKey } from 'pmcrypto';

interface Props {
    publicKey: OpenPGPKey;
    emailAddress?: string;
    className?: string;
}

const KeyWarningIcon = ({ publicKey, emailAddress, className }: Props) => {
    if (!emailAddress) {
        return null;
    }
    const icon = <Icon name="attention" className={classnames([className, 'color-global-attention'])} />;
    const warning = getEmailMismatchWarning(publicKey, emailAddress);

    if (!warning.length) {
        return null;
    }

    return <Tooltip title={warning[0]}>{icon}</Tooltip>;
};

export default KeyWarningIcon;
