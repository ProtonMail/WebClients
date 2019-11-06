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
    useUser,
    useAddresses,
    useAddressesKeys,
    Loader
} from 'react-components';
import { setKeyPrimary, setKeyFlags } from 'proton-shared/lib/keys/keysManager';

import { getAllKeysToReactivate, convertKey } from './shared/helper';
import AddressKeysHeaderActions from './AddressKeysHeaderActions';
import { ACTIONS } from './KeysActions';
import KeysTable from './KeysTable';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';
import { setKeyFlagsRoute, setKeyPrimaryRoute } from 'proton-shared/lib/api/keys';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';
import { KEY_FLAG } from 'proton-shared/lib/constants';

const { SIGNED, ENCRYPTED_AND_SIGNED, CLEAR_TEXT } = KEY_FLAG;

/**
 * @param {number} action
 * @return {number}
 */
export const getNewKeyFlags = (action) => {
    if (action === ACTIONS.MARK_OBSOLETE) {
        return SIGNED;
    }
    if (action === ACTIONS.MARK_NOT_OBSOLETE) {
        return ENCRYPTED_AND_SIGNED;
    }
    if (action === ACTIONS.MARK_COMPROMISED) {
        return CLEAR_TEXT;
    }
    if (action === ACTIONS.MARK_NOT_COMPROMISED) {
        return SIGNED;
    }
    throw new Error('Unknown action');
};

const AddressKeysSection = () => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeysList] = useUserKeys(User);
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys(User, Addresses, userKeysList);
    const [loadingKeyIdx, setLoadingKeyIdx] = useState(-1);
    const [addressIndex, setAddressIndex] = useState(() => (Array.isArray(Addresses) ? 0 : -1));

    useEffect(() => {
        if (addressIndex === -1 && Array.isArray(Addresses)) {
            setAddressIndex(0);
        }
    }, [addressIndex, Addresses]);

    const title = <SubTitle>{c('Title').t`Email encryption keys`}</SubTitle>;

    if (addressIndex === -1 || loadingAddresses) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

    if (!Array.isArray(Addresses) || !Addresses.length) {
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
            privateKey,
            publicKey
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
            return createModal(<ExportPublicKeyModal name={addressEmail} publicKey={publicKey} />);
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
            const updatedKeys = setKeyPrimary({
                keys: addressKeys,
                keyID: ID
            });
            await api(
                setKeyPrimaryRoute({
                    ID,
                    SignedKeyList: await getSignedKeyList(updatedKeys)
                })
            );

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
            const newKeyFlags = getNewKeyFlags(action);
            const updatedKeys = setKeyFlags({
                keys: addressKeys,
                keyID: ID,
                flags: newKeyFlags
            });
            await api(
                setKeyFlagsRoute({
                    ID,
                    Flags: newKeyFlags,
                    SignedKeyList: await getSignedKeyList(updatedKeys)
                })
            );

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
            ...convertKey({ User, Address: address, Key, privateKey })
        };
    });

    const { isSubUser } = User;
    const allKeysToReactivate = getAllKeysToReactivate({ Addresses, User, addressesKeysMap, userKeysList });
    const totalInactiveKeys = allKeysToReactivate.reduce((acc, { inactiveKeys }) => acc + inactiveKeys.length, 0);
    const canReactivate = !isSubUser && totalInactiveKeys >= 1;

    return (
        <>
            {title}
            <Alert learnMore="https://protonmail.com/support/knowledge-base/pgp-key-management/">
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
