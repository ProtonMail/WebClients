import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { DropdownActions } from 'react-components';

export const ACTIONS = {
    PRIMARY: 1,
    DELETE: 2,
    EXPORT_PUBLIC_KEY: 3,
    EXPORT_PRIVATE_KEY: 4,
    REACTIVATE: 5,
    MARK_OBSOLETE: 6,
    MARK_NOT_OBSOLETE: 7,
    MARK_COMPROMISED: 8,
    MARK_NOT_COMPROMISED: 9
};

const KeysActions = ({
    onAction,
    loading,
    isAddressKey,
    isAddressDisabled,
    isPrimary,
    isDecrypted,
    isEncryptingAndSigning,
    isCompromised,
    isObsolete
}) => {
    const canReactivate = !isDecrypted;
    const canExportPublicKey = true;
    const canExportPrivateKey = isDecrypted;
    const canMakePrimary = isAddressKey && !isPrimary && !isAddressDisabled && isDecrypted && isEncryptingAndSigning;
    const canMark = isAddressKey && !isPrimary;
    const canMarkObsolete = canMark && !isAddressDisabled && isDecrypted && !isObsolete && !isCompromised;
    const canMarkNotObsolete = canMark && isObsolete;
    const canMarkCompromised = canMark && !isCompromised;
    const canMarkNotCompromised = canMark && isCompromised;
    const canDelete = isAddressKey && !isPrimary;

    const list = [
        canReactivate && {
            text: c('Keys actions').t`Reactivate`,
            onClick: () => onAction(ACTIONS.REACTIVATE)
        },
        canExportPublicKey && {
            text: c('Keys actions').t`Export`,
            onClick: () => onAction(ACTIONS.EXPORT_PUBLIC_KEY)
        },
        canExportPrivateKey && {
            text: c('Keys actions').t`Export private key`,
            onClick: () => onAction(ACTIONS.EXPORT_PRIVATE_KEY)
        },
        canMakePrimary && {
            text: c('Keys actions').t`Make primary`,
            onClick: () => onAction(ACTIONS.PRIMARY)
        },
        canMarkObsolete && {
            text: c('Keys actions').t`Mark obsolete`,
            tooltip: c('Keys actions').t`Disables encryption with this key`,
            onClick: () => onAction(ACTIONS.MARK_OBSOLETE)
        },
        canMarkNotObsolete && {
            text: c('Keys actions').t`Mark not obsolete`,
            tooltip: c('Keys actions').t`Enable encryption with this key`,
            onClick: () => onAction(ACTIONS.MARK_NOT_OBSOLETE)
        },
        canMarkCompromised && {
            text: c('Keys actions').t`Mark compromised`,
            tooltip: c('Keys actions').t`Disables signature verification and encryption with this key`,
            onClick: () => onAction(ACTIONS.MARK_COMPROMISED)
        },
        canMarkNotCompromised && {
            text: c('Keys actions').t`Mark not compromised`,
            tooltip: c('Keys actions').t`Enable signature verification and encryption with this key`,
            onClick: () => onAction(ACTIONS.MARK_NOT_COMPROMISED)
        },
        canDelete && {
            text: c('Keys actions').t`Delete`,
            onClick: () => onAction(ACTIONS.DELETE)
        }
    ].filter(Boolean);

    return <DropdownActions loading={loading} list={list} />;
};

KeysActions.propTypes = {
    onAction: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    isAddressKey: PropTypes.bool,
    isPrimary: PropTypes.bool,
    isDecrypted: PropTypes.bool,
    isEncryptingAndSigning: PropTypes.bool,
    isCompromised: PropTypes.bool,
    isObsolete: PropTypes.bool,
    isAddressDisabled: PropTypes.bool
};

export default KeysActions;
