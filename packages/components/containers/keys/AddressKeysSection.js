import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    Block,
    Select,
    SubTitle,
    PrimaryButton,
    Alert,
    useModals,
    useApi,
    useEventManager,
    useUserKeys,
    useAddressesKeys,
    Loader
} from 'react-components';
import createKeysManager from 'proton-shared/lib/keys/keysManager';

import { getAllKeysToReactivate, convertKey, getNewKeyFlags } from './helper';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';
import AddressKeysHeaderActions from './AddressKeysHeaderActions';
import { ACTIONS } from './KeysActions';
import KeysTable from './KeysTable';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';

const AddressKeysSection = () => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [User] = useUser();
    const [Addresses] = useAddresses();
    const [userKeysList] = useUserKeys(User);
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys(User, Addresses);
    const [loadingKeyIdx, setLoadingKeyIdx] = useState(-1);
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
    const addressKeys = addressesKeysMap && addressesKeysMap[addressID];

    if (loadingAddressesKeys && !Array.isArray(addressKeys)) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

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

    const isLoadingKey = loadingKeyIdx !== -1;

    const handleKeyAction = async (action, keyIdx) => {
        // Since an action affects the whole key list, only allow one at a time.
        if (isLoadingKey) {
            return;
        }
        try {
            setLoadingKeyIdx(keyIdx);
            const targetKey = addressKeys[keyIdx];
            await handleAction(action, targetKey);
            setLoadingKeyIdx(-1);
        } catch (e) {
            setLoadingKeyIdx(-1);
        }
    };

    const addressKeysFormatted = addressKeys.map(({ Key, privateKey }, idx) => {
        return {
            isLoading: loadingKeyIdx === idx,
            ...convertKey({
                Address: address,
                Key,
                privateKey
            })
        };
    });

    const { isSubUser } = User;
    const allKeysToReactivate = getAllKeysToReactivate({ Addresses, User, addressesKeysMap, userKeysList });
    const totalInactiveKeys = allKeysToReactivate.reduce((acc, { inactiveKeys }) => acc + inactiveKeys.length, 0);
    const canReactivate = !isSubUser && totalInactiveKeys >= 1;

    return (
        <>
            {title}
            <Alert learnMore="todo">
                {c('Info')
                    .t`Download your PGP Keys for use with other PGP compatible services. Only incoming messages in inline OpenPGP format are currently supported.`}
            </Alert>
            {canReactivate && (
                <Block>
                    <PrimaryButton
                        onClick={() => {
                            !isLoadingKey && createModal(<ReactivateKeysModal allKeys={allKeysToReactivate} />);
                        }}
                    >
                        {c('Action').t`Reactivate keys`}
                    </PrimaryButton>
                </Block>
            )}
            {Addresses.length > 1 && (
                <Block>
                    <Select
                        value={addressIndex}
                        options={Addresses.map(({ Email }, i) => ({ text: Email, value: i }))}
                        onChange={({ target: { value } }) => !isLoadingKey && setAddressIndex(+value)}
                    />
                </Block>
            )}
            <AddressKeysHeaderActions
                isLoadingKey={isLoadingKey}
                User={User}
                Address={address}
                addressKeys={addressKeys}
            />
            <KeysTable keys={addressKeysFormatted} onAction={handleKeyAction} />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
