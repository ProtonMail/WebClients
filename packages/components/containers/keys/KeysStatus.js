import PropTypes from 'prop-types';
import React from 'react';
import { Badge, Tooltip } from 'react-components';
import { c } from 'ttag';

export const STATUSES = {
    PRIMARY: 1,
    DECRYPTED: 2,
    ENCRYPTED: 3,
    OBSOLETE: 4,
    COMPROMISED: 5,
    DISABLED: 6
};

const KeyStatusBadge = ({ tooltip, title, type }) => (
    <Tooltip title={tooltip}>
        <Badge type={type}>{title}</Badge>
    </Tooltip>
);

KeyStatusBadge.propTypes = {
    tooltip: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
};

const KeyStatusPrimary = () => ({
    tooltip: c('Tooltip').t`ProtonMail users will use this key by default for sending`,
    title: c('Key state badge').t`Primary`,
    type: 'default'
});

const KeyStatusDecrypted = () => ({
    tooltip: c('Tooltip').t`You have locally decrypted this key`,
    title: c('Key state badge').t`Active`,
    type: 'success'
});

const KeyStatusEncrypted = () => ({
    tooltip: c('Tooltip').t`This key is encrypted with an old password`,
    title: c('Key state badge').t`Inactive`,
    type: 'error'
});

const KeyStatusObsolete = () => ({
    tooltip: c('Tooltip').t`This key cannot be used for encryption`,
    title: c('Key state badge').t`Obsolete`,
    type: 'warning'
});

const KeyStatusDisabled = () => ({
    tooltip: c('Tooltip').t`This address has been disabled`,
    title: c('Key state badge').t`Disabled`,
    type: 'warning'
});

const KeyStatusCompromised = () => ({
    tooltip: c('Tooltip')
        .t`Signatures produced by this key are treated as invalid and this key cannot be used for encryption`,
    title: c('Key state badge').t`Compromised`,
    type: 'warning'
});

const STATUS_TO_TEXT = {
    [STATUSES.PRIMARY]: KeyStatusPrimary,
    [STATUSES.DECRYPTED]: KeyStatusDecrypted,
    [STATUSES.ENCRYPTED]: KeyStatusEncrypted,
    [STATUSES.OBSOLETE]: KeyStatusObsolete,
    [STATUSES.COMPROMISED]: KeyStatusCompromised,
    [STATUSES.DISABLED]: KeyStatusDisabled
};

const KeysStatus = ({ statuses }) => {
    const list = statuses.map((status) => {
        const statusText = STATUS_TO_TEXT[status];
        if (!statusText) {
            throw new Error('Invalid status');
        }
        return <KeyStatusBadge key={status} {...statusText()} />;
    });
    return <>{list}</>;
};

KeysStatus.propTypes = {
    statuses: PropTypes.array.isRequired
};

export default KeysStatus;
