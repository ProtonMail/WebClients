import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    Block,
    Select,
    SubTitle,
    Alert,
    useModals,
    useApi,
    useEventManager,
    useUserKeys,
    useAddressesKeys,
    Loader
} from 'react-components';
import createKeysManager from 'proton-shared/lib/keys/keysManager';

import { getAllKeysToReactivate, convertKey, getNewKeyFlags, getPrimaryKey } from './helper';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';
import KeysTable from './KeysTable';
import { ACTIONS } from './KeysActions';
import AddKeyModal from './addKey/AddKeyModal';
import ImportKeyModal from './importKeys/ImportKeyModal';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';
import KeysHeaderActions, { ACTIONS as HEADER_ACTIONS } from './KeysHeaderActions';

const AddressKeysSection = () => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [User] = useUser();
    const [Addresses] = useAddresses();
    const [userKeysList] = useUserKeys(User);
    const [addressesKeysMap = {}, loadingAddressesKeys] = useAddressesKeys(User, Addresses);
    const [loadingKeyID, setLoadingKeyID] = useState();
    const [addressIndex, setAddressIndex] = useState(() => (Array.isArray(Addresses) ? 0 : -1));

    useEffect(() => {
        if (addressIndex === -1 && Array.isArray(Addresses)) {
            setAddressIndex(0);
        }
    }, [addressIndex, Addresses]);

    const title = <SubTitle>{c('Title').t`Email encryption keys`}</SubTitle>;

    if (addressIndex === -1 || !Array.isArray(Addresses)) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

    if (!Addresses.length) {
        return (
            <>
                {title}
                <Alert>{c('Info').t`No addresses exist`}</Alert>
            </>
        );
    }

    const address = Addresses[addressIndex];
    const { ID: addressID, Email: addressEmail } = address;
    const addressKeys = addressesKeysMap[addressID];

    if (loadingAddressesKeys && !Array.isArray(addressKeys)) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

    const addressKeysFormatted = addressKeys.map(({ Key, privateKey }) => {
        const { ID } = Key;
        return {
            isLoading: loadingKeyID === ID,
            ...convertKey({
                Address: address,
                Key,
                privateKey
            })
        };
    });

    const addressOptions =
        Addresses.length > 1
            ? Addresses.map(({ Email, ID: addressID }, i) => {
                  const primaryKey = getPrimaryKey(addressesKeysMap[addressID]);
                  const postfix = primaryKey ? ` (${primaryKey.privateKey.getFingerprint()})` : '';
                  return {
                      text: Email + postfix,
                      value: i
                  };
              })
            : [];

    const { isSubUser } = User;
    const { privateKey: primaryPrivateKey } = getPrimaryKey(addressKeys) || {};
    const allKeysToReactivate = getAllKeysToReactivate({ Addresses, User, addressesKeysMap, userKeysList });
    const totalInactiveKeys = allKeysToReactivate.reduce((acc, { inactiveKeys }) => acc + inactiveKeys.length, 0);

    const keysPermissions = {
        [HEADER_ACTIONS.ADD]: !isSubUser,
        [HEADER_ACTIONS.IMPORT]: !isSubUser,
        [HEADER_ACTIONS.EXPORT_PRIVATE_KEY]: primaryPrivateKey && primaryPrivateKey.isDecrypted(),
        [HEADER_ACTIONS.EXPORT_PUBLIC_KEY]: !!primaryPrivateKey,
        [HEADER_ACTIONS.REACTIVATE]: !isSubUser && totalInactiveKeys >= 1
    };

    const handleKeysAction = (action) => {
        if (loadingKeyID) {
            return;
        }
        if (action === HEADER_ACTIONS.ADD) {
            return createModal(<AddKeyModal Address={address} addressKeys={addressKeys} />);
        }
        if (action === HEADER_ACTIONS.IMPORT) {
            return createModal(<ImportKeyModal Address={address} addressKeys={addressKeys} />);
        }
        if (action === HEADER_ACTIONS.EXPORT_PUBLIC_KEY) {
            return createModal(<ExportPublicKeyModal name={addressEmail} privateKey={primaryPrivateKey} />);
        }
        if (action === HEADER_ACTIONS.EXPORT_PRIVATE_KEY) {
            return createModal(<ExportPrivateKeyModal name={addressEmail} privateKey={primaryPrivateKey} />);
        }
        if (action === HEADER_ACTIONS.REACTIVATE) {
            return createModal(<ReactivateKeysModal allKeys={allKeysToReactivate} />);
        }
    };

    const handleAction = async (action, targetKey) => {
        const {
            Key: { ID },
            privateKey
        } = targetKey;

        if (action === ACTIONS.REACTIVATE) {
            const addressKeysToReactivate = [
                {
                    Address: address,
                    inactiveKeys: [targetKey],
                    keys: addressKeys
                }
            ];
            return createModal(<ReactivateKeysModal allKeys={addressKeysToReactivate} />);
        }
        if (action === ACTIONS.EXPORT_PUBLIC_KEY) {
            return createModal(<ExportPublicKeyModal name={addressEmail} privateKey={privateKey} />);
        }
        if (action === ACTIONS.EXPORT_PRIVATE_KEY) {
            return createModal(<ExportPrivateKeyModal name={addressEmail} privateKey={privateKey} />);
        }
        if (action === ACTIONS.DELETE) {
            return createModal(
                <DeleteKeyModal Address={address} addressKeys={addressKeys} KeyID={ID} privateKey={privateKey} />
            );
        }
        if (action === ACTIONS.PRIMARY) {
            const keysManager = createKeysManager(addressKeys, api);
            await keysManager.setKeyPrimary(ID);
            return await call();
        }
        if (
            [
                ACTIONS.MARK_NOT_COMPROMISED,
                ACTIONS.MARK_COMPROMISED,
                ACTIONS.MARK_OBSOLETE,
                ACTIONS.MARK_NOT_OBSOLETE
            ].includes(action)
        ) {
            const newFlags = getNewKeyFlags(action);
            const keysManager = createKeysManager(addressKeys, api);
            await keysManager.setKeyFlags(ID, newFlags);
            return await call();
        }
    };

    const handleKeyAction = async (action, keyID, keyIndex) => {
        // Since an action affects the whole key list, only allow one at a time.
        if (loadingKeyID) {
            return;
        }
        try {
            setLoadingKeyID(keyID);
            const targetKey = addressKeys[keyIndex];
            await handleAction(action, targetKey);
            setLoadingKeyID();
        } catch (e) {
            setLoadingKeyID();
        }
    };

    return (
        <>
            {title}
            <Alert learnMore="todo">
                {c('Info')
                    .t`Download your PGP Keys for use with other PGP compatible services. Only incoming messages in inline OpenPGP format are currently supported.`}
            </Alert>
            <Block>
                <KeysHeaderActions permissions={keysPermissions} onAction={handleKeysAction} />
            </Block>
            {Addresses.length > 1 ? (
                <Select
                    value={addressIndex}
                    options={addressOptions}
                    onChange={({ target: { value } }) => !loadingKeyID && setAddressIndex(+value)}
                />
            ) : null}
            <KeysTable keys={addressKeysFormatted} onAction={handleKeyAction} />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
