import React from 'react';
import { c } from 'ttag';
import { useModals, Block, DropdownActions } from 'react-components';
import PropTypes from 'prop-types';

import { getPrimaryKey } from './helper';
import AddKeyModal from './addKey/AddKeyModal';
import ImportKeyModal from './importKeys/ImportKeyModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';

const AddressKeysHeaderActions = ({
    isLoadingKey,
    Address,
    Address: { Email: emailAddress },
    User: { isSubUser, isPrivate },
    addressKeys
}) => {
    const { createModal } = useModals();

    const { privateKey: primaryPrivateKey } = getPrimaryKey(addressKeys) || {};

    const canAdd = !isSubUser && isPrivate;
    const canImport = canAdd;
    const canExportPrivateKey = primaryPrivateKey && primaryPrivateKey.isDecrypted();
    const canExportPublicKey = !!primaryPrivateKey;

    const createActions = [
        canAdd && {
            text: c('Action').t`Create key`,
            onClick: () => !isLoadingKey && createModal(<AddKeyModal Address={Address} addressKeys={addressKeys} />)
        },
        canImport && {
            text: c('Action').t`Import key`,
            onClick: () => !isLoadingKey && createModal(<ImportKeyModal Address={Address} addressKeys={addressKeys} />)
        }
    ].filter(Boolean);

    const exportActions = [
        canExportPublicKey && {
            text: c('Action').t`Export`,
            onClick: () => createModal(<ExportPublicKeyModal name={emailAddress} privateKey={primaryPrivateKey} />)
        },
        canExportPrivateKey && {
            text: c('Address action').t`Export private key`,
            onClick: () => createModal(<ExportPrivateKeyModal name={emailAddress} privateKey={primaryPrivateKey} />)
        }
    ].filter(Boolean);

    if (!exportActions.length && !createActions.length) {
        return null;
    }

    return (
        <Block>
            {createActions.length ? (
                <span className="mr1">
                    <DropdownActions list={createActions} />
                </span>
            ) : null}
            <DropdownActions list={exportActions} />
        </Block>
    );
};

AddressKeysHeaderActions.propTypes = {
    isLoadingKey: PropTypes.bool.isRequired,
    Address: PropTypes.object.isRequired,
    User: PropTypes.object.isRequired,
    addressKeys: PropTypes.array.isRequired
};

export default AddressKeysHeaderActions;
