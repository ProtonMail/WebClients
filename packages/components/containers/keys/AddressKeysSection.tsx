import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { addressesThunk, useInactiveKeys, userKeysThunk } from '@proton/account';
import { useAddressesKeys } from '@proton/account/addressKeys/hooks';
import { useAddresses } from '@proton/account/addresses/hooks';
import { getKTActivation } from '@proton/account/kt/actions';
import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useEventManager from '@proton/components/hooks/useEventManager';
import useModals from '@proton/components/hooks/useModals';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency';
import { useOutgoingAddressForwardings } from '@proton/mail/store/forwarding/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { ForwardingType, type KeyGenConfig, type KeyGenConfigV6 } from '@proton/shared/lib/interfaces';
import type { OnKeyImportCallback } from '@proton/shared/lib/keys';
import {
    addAddressKeysProcess,
    deleteAddressKey,
    getPrimaryAddressKeysForSigning,
    importKeysProcess,
    reactivateKeysProcess,
    setAddressKeyFlags,
    setPrimaryAddressKey,
} from '@proton/shared/lib/keys';
import { FlagAction, getNewAddressKeyFlags } from '@proton/shared/lib/keys/getNewAddressKeyFlags';
import noop from '@proton/utils/noop';

import AddressKeysHeaderActions from './AddressKeysHeaderActions';
import KeysTable from './KeysTable';
import AddKeyModal from './addKey/AddKeyModal';
import ChangePrimaryKeyForwardingNoticeModal from './changePrimaryKeyForwardingNotice/ChangePrimaryKeyForwardingNoticeModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ImportKeyModal from './importKeys/ImportKeyModal';
import type { ImportKey } from './importKeys/interface';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import { getKeyByID } from './shared/helper';
import { useKeysMetadata } from './shared/useKeysMetadata';

const AddressKeysSection = () => {
    const { createModal } = useModals();
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeys] = useUserKeys();
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys();
    const [loadingKeyID, setLoadingKeyID] = useState<string>('');
    const [addressIndex, setAddressIndex] = useState(() => (Array.isArray(Addresses) ? 0 : -1));
    const createKTVerifier = useKTVerifier();
    const keyReactivationRequests = useInactiveKeys();
    const dispatch = useDispatch();
    const [outgoingAddressForwardings = [], loadingOutgoingAddressForwardings] = useOutgoingAddressForwardings();

    const Address = Addresses ? Addresses[addressIndex] : undefined;
    const { ID: addressID = '', Email: addressEmail = '' } = Address || {};
    const addressWithKeys = addressesKeys?.find(({ address }) => address.ID === addressID);
    const addressKeys = addressWithKeys?.keys;

    const {
        address: { displayKeys: addressKeysDisplay, existingAlgorithms },
    } = useKeysMetadata({
        address: Address,
        addressKeys,
        user: User,
        userKeys,
        loadingKeyID,
    });

    const [addKeyProps, setAddKeyModalOpen, renderAddKey] = useModalState();
    const [importKeyProps, setImportKeyModalOpen, renderImportKey] = useModalState();
    const [reactivateKeyProps, setReactivateKeyModalOpen, renderReactivateKey] = useModalState();

    useEffect(() => {
        if (addressIndex === -1 && Array.isArray(Addresses)) {
            setAddressIndex(0);
        }
    }, [addressIndex, Addresses]);

    const isLoadingKey = loadingKeyID !== '';
    const outgoingE2EEForwardings =
        loadingOutgoingAddressForwardings || !Address
            ? []
            : outgoingAddressForwardings.filter(
                  ({ Type, ForwarderAddressID }) =>
                      Type === ForwardingType.InternalEncrypted && ForwarderAddressID === Address.ID
              );
    const hasOutgoingE2EEForwardings = outgoingE2EEForwardings.length > 0;

    const handleSetPrimaryKey = async (ID: string) => {
        if (isLoadingKey || !addressKeys || !userKeys || loadingOutgoingAddressForwardings) {
            return;
        }
        const addressKey = getKeyByID(addressKeys, ID);

        if (!addressKey || !Address) {
            throw new Error('Key not found');
        }

        const onSetPrimaryKey = async (ID: string) => {
            try {
                setLoadingKeyID(ID);
                const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
                const [, newActiveKeys, formerActiveKeys] = await setPrimaryAddressKey(
                    api,
                    Address,
                    addressKeys,
                    ID,
                    keyTransparencyVerify
                );
                await Promise.all([
                    resignSKLWithPrimaryKey({
                        api,
                        ktActivation: dispatch(getKTActivation()),
                        address: Address,
                        newPrimaryKeys: getPrimaryAddressKeysForSigning(newActiveKeys, true),
                        formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
                        userKeys,
                    }),
                    keyTransparencyCommit(User, userKeys),
                ]);
                await call();
            } finally {
                setLoadingKeyID('');
            }
        };

        if (!hasOutgoingE2EEForwardings) {
            return onSetPrimaryKey(ID);
        }

        // any outgoing e2ee forwardings will be paused if the primary key changes;
        // hence we ask for user confirmation
        createModal(
            <ChangePrimaryKeyForwardingNoticeModal
                onMakeKeyPrimary={async () => onSetPrimaryKey(ID)}
                fingerprint={addressKey.publicKey.getFingerprint()}
            />
        );
    };

    const handleSetFlag = async (ID: string, flagAction: FlagAction) => {
        if (isLoadingKey || !addressKeys || !userKeys) {
            return;
        }
        const addressDisplayKey = getKeyByID(addressKeysDisplay, ID);

        if (!addressDisplayKey || !Address) {
            throw new Error('Key not found');
        }

        try {
            setLoadingKeyID(ID);
            const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
            await setAddressKeyFlags(
                api,
                Address,
                addressKeys,
                ID,
                getNewAddressKeyFlags(addressDisplayKey.flags, flagAction),
                keyTransparencyVerify
            );
            await keyTransparencyCommit(User, userKeys);
            await call();
        } finally {
            setLoadingKeyID('');
        }
    };

    const handleSetObsolete = (ID: string) => handleSetFlag(ID, FlagAction.MARK_OBSOLETE);
    const handleSetNotObsolete = (ID: string) => handleSetFlag(ID, FlagAction.MARK_NOT_OBSOLETE);
    const handleSetCompromised = (ID: string) => handleSetFlag(ID, FlagAction.MARK_COMPROMISED);
    const handleSetNotCompromised = (ID: string) => handleSetFlag(ID, FlagAction.MARK_NOT_COMPROMISED);

    const handleDeleteKey = (ID: string) => {
        if (isLoadingKey || !addressKeys || !userKeys) {
            return;
        }
        const addressKey = getKeyByID(addressKeys, ID);
        const addressDisplayKey = getKeyByID(addressKeysDisplay, ID);
        if (!addressDisplayKey || !Address) {
            throw new Error('Key not found');
        }
        const { fingerprint } = addressDisplayKey;
        const privateKey = addressKey?.privateKey;

        const onDelete = async (): Promise<void> => {
            const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
            await deleteAddressKey(api, Address, addressKeys, ID, keyTransparencyVerify);
            await keyTransparencyCommit(User, userKeys);
            await call();
        };

        const onExport = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (!privateKey) {
                    return reject(new Error('Private key is not decrypted'));
                }
                createModal(
                    <ExportPrivateKeyModal
                        onClose={reject}
                        onSuccess={resolve}
                        name={addressEmail}
                        privateKey={privateKey}
                    />
                );
            });
        };

        createModal(
            <DeleteKeyModal
                onDelete={onDelete}
                onExport={privateKey ? onExport : undefined}
                fingerprint={fingerprint}
            />
        );
    };

    const handleAddKey = () => {
        if (isLoadingKey || !addressKeys || !userKeys) {
            return;
        }
        if (!Address) {
            throw new Error('Keys not found');
        }
        setAddKeyModalOpen(true);
    };

    const onAdd = async (keyGenConfig: KeyGenConfig | KeyGenConfigV6) => {
        if (!Address || !addressKeys || !userKeys || !Addresses) {
            throw new Error('Missing address or address keys');
        }
        try {
            stop();
            const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
            const [newKey, updatedActiveKeys, formerActiveKeys] = await addAddressKeysProcess({
                api,
                userKeys,
                keyGenConfig: keyGenConfig,
                addresses: Addresses,
                address: Address,
                addressKeys: addressKeys,
                keyPassword: authentication.getPassword(),
                keyTransparencyVerify,
            });
            await Promise.all([
                resignSKLWithPrimaryKey({
                    api,
                    ktActivation: dispatch(getKTActivation()),
                    address: Address,
                    newPrimaryKeys: getPrimaryAddressKeysForSigning(updatedActiveKeys, true),
                    formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
                    userKeys,
                }),
                keyTransparencyCommit(User, userKeys),
            ]);
            await call();
            return newKey.fingerprint;
        } finally {
            start();
        }
    };

    const handleImportKey = () => {
        if (isLoadingKey || !addressKeys || !userKeys) {
            return;
        }
        if (!Address) {
            throw new Error('Keys not found');
        }

        setImportKeyModalOpen(true);
    };

    const onProcessImport = async (keyImportRecords: ImportKey[], cb: OnKeyImportCallback) => {
        if (!Address || !addressKeys || !userKeys || !Addresses) {
            throw new Error('Missing address or address keys');
        }
        try {
            stop();
            const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
            await importKeysProcess({
                api,
                address: Address,
                addressKeys: addressKeys,
                addresses: Addresses,
                userKeys,
                keyImportRecords,
                keyPassword: authentication.getPassword(),
                onImport: cb,
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(User, userKeys);
            return await call();
        } finally {
            start();
        }
    };

    const handleExportPrivate = (ID: string) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        const decryptedAddressKey = getKeyByID(addressKeys, ID);
        if (!decryptedAddressKey) {
            throw new Error('Key not found');
        }
        createModal(<ExportPrivateKeyModal name={addressEmail} privateKey={decryptedAddressKey.privateKey} />);
    };

    const handleExportPublic = (ID: string) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        const decryptedAddressKey = getKeyByID(addressKeys, ID);
        const Key = getKeyByID(Address?.Keys || [], ID);
        if (!Key) {
            throw new Error('Key not found');
        }
        createModal(
            <ExportPublicKeyModal
                name={addressEmail}
                fallbackPrivateKey={Key.PrivateKey}
                publicKey={decryptedAddressKey?.publicKey}
            />
        );
    };

    const { isSelf, isPrivate } = User;
    const hasDecryptedUserKeys = (userKeys?.length || 0) > 0;

    const canAdd = isSelf && isPrivate && hasDecryptedUserKeys;
    const canImport = canAdd;

    const children = (() => {
        if (addressIndex === -1 || loadingAddresses) {
            return (
                <SettingsSectionWide>
                    <Loader />
                </SettingsSectionWide>
            );
        }

        if (!Array.isArray(Addresses) || !Addresses.length) {
            return (
                <SettingsSectionWide>
                    <SettingsParagraph>{c('Info').t`No addresses exist`}</SettingsParagraph>
                </SettingsSectionWide>
            );
        }

        if (loadingAddressesKeys && !Array.isArray(addressKeys)) {
            return (
                <SettingsSectionWide>
                    <Loader />
                </SettingsSectionWide>
            );
        }

        return (
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info').t`Download your PGP keys for use with other PGP-compatible services.`}
                </SettingsParagraph>
                {!!keyReactivationRequests.length && (
                    <div className="mb-4">
                        <Button disabled={isLoadingKey} color="norm" onClick={() => setReactivateKeyModalOpen(true)}>
                            {c('Action').t`Reactivate keys`}
                        </Button>
                    </div>
                )}
                <AddressKeysHeaderActions
                    addresses={Addresses}
                    addressIndex={addressIndex}
                    onAddKey={canAdd ? handleAddKey : undefined}
                    onImportKey={canImport ? handleImportKey : undefined}
                    onChangeAddress={({ target: { value } }: ChangeEvent<HTMLSelectElement>) => {
                        if (isLoadingKey) {
                            return;
                        }

                        setAddressIndex(+value);
                    }}
                />
                <KeysTable
                    keys={addressKeysDisplay}
                    onExportPrivateKey={handleExportPrivate}
                    onExportPublicKey={handleExportPublic}
                    onDeleteKey={handleDeleteKey}
                    onSetPrimary={handleSetPrimaryKey}
                    onSetCompromised={handleSetCompromised}
                    onSetNotCompromised={handleSetNotCompromised}
                    onSetObsolete={handleSetObsolete}
                    onSetNotObsolete={handleSetNotObsolete}
                />
            </SettingsSectionWide>
        );
    })();

    return (
        <>
            {renderAddKey && (
                <AddKeyModal
                    type="address"
                    existingAlgorithms={existingAlgorithms}
                    onAdd={onAdd}
                    hasOutgoingE2EEForwardings={hasOutgoingE2EEForwardings}
                    {...addKeyProps}
                />
            )}
            {renderImportKey && (
                <ImportKeyModal
                    onProcess={onProcessImport}
                    hasOutgoingE2EEForwardings={hasOutgoingE2EEForwardings}
                    {...importKeyProps}
                />
            )}
            {renderReactivateKey && (
                <ReactivateKeysModal
                    userKeys={userKeys || []}
                    keyReactivationRequests={keyReactivationRequests}
                    onProcess={async (keyReactivationRecords, onReactivation) => {
                        try {
                            stop();
                            const [userKeys, addresses] = await Promise.all([
                                dispatch(userKeysThunk()),
                                dispatch(addressesThunk()),
                            ]);
                            const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
                            await reactivateKeysProcess({
                                api,
                                user: User,
                                userKeys,
                                addresses,
                                keyReactivationRecords,
                                keyPassword: authentication.getPassword(),
                                onReactivation,
                                keyTransparencyVerify,
                            });
                            await keyTransparencyCommit(User, userKeys).catch(noop);
                            return await call();
                        } finally {
                            start();
                        }
                    }}
                    {...reactivateKeyProps}
                />
            )}
            {children}
        </>
    );
};

export default AddressKeysSection;
