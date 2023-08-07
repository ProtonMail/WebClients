import { ChangeEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AlgorithmInfo } from '@proton/crypto';
import { EncryptionConfig } from '@proton/shared/lib/interfaces';
import {
    OnKeyImportCallback,
    addAddressKeysProcess,
    deleteAddressKey,
    importKeysProcess,
    reactivateKeysProcess,
    setAddressKeyFlags,
    setPrimaryAddressKey,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { Loader, useModalState } from '../../components';
import {
    useAddresses,
    useAddressesKeys,
    useApi,
    useAuthentication,
    useEventManager,
    useModals,
    useUser,
    useUserKeys,
} from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import { useKTVerifier } from '../keyTransparency';
import useResignSKLWithPrimaryKey from '../keyTransparency/useResignSKLWithPrimaryKey';
import AddressKeysHeaderActions from './AddressKeysHeaderActions';
import KeysTable from './KeysTable';
import AddKeyModal from './addKey/AddKeyModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ImportKeyModal from './importKeys/ImportKeyModal';
import { ImportKey } from './importKeys/interface';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import { getAllKeysReactivationRequests } from './reactivateKeys/getAllKeysToReactive';
import { getNewKeyFlags } from './shared/flags';
import { getKeyByID } from './shared/helper';
import { FlagAction } from './shared/interface';
import useDisplayKeys from './shared/useDisplayKeys';

const AddressKeysSection = () => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeys] = useUserKeys();
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys();
    const [loadingKeyID, setLoadingKeyID] = useState<string>('');
    const [addressIndex, setAddressIndex] = useState(() => (Array.isArray(Addresses) ? 0 : -1));
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => User);
    const resignSKLWithPrimaryKey = useResignSKLWithPrimaryKey();

    const Address = Addresses ? Addresses[addressIndex] : undefined;
    const { ID: addressID = '', Email: addressEmail = '' } = Address || {};
    const addressWithKeys = addressesKeys?.find(({ address }) => address.ID === addressID);
    const addressKeys = addressWithKeys?.keys;
    const addressKeysDisplay = useDisplayKeys({
        keys: addressKeys,
        Address,
        User,
        loadingKeyID,
    });

    const existingAlgorithms = addressKeysDisplay.reduce<AlgorithmInfo[]>(
        (acc, { algorithmInfos }) => acc.concat(algorithmInfos),
        []
    );

    const [addKeyProps, setAddKeyModalOpen, renderAddKey] = useModalState();
    const [importKeyProps, setImportKeyModalOpen, renderImportKey] = useModalState();
    const [reactivateKeyProps, setReactivateKeyModalOpen, renderReactivateKey] = useModalState();

    useEffect(() => {
        if (addressIndex === -1 && Array.isArray(Addresses)) {
            setAddressIndex(0);
        }
    }, [addressIndex, Addresses]);

    const isLoadingKey = loadingKeyID !== '';

    const handleSetPrimaryKey = async (ID: string) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        const addressKey = getKeyByID(addressKeys, ID);
        if (!addressKey || !Address) {
            throw new Error('Key not found');
        }

        try {
            setLoadingKeyID(ID);
            const [newPrimaryKey] = await setPrimaryAddressKey(api, Address, addressKeys, ID, keyTransparencyVerify);
            await Promise.all([
                resignSKLWithPrimaryKey({
                    address: Address,
                    newPrimaryKey: newPrimaryKey.privateKey,
                    formerPrimaryKey: addressKeys[0].publicKey,
                    userKeys,
                }),
                keyTransparencyCommit(userKeys),
            ]);
            await call();
        } finally {
            setLoadingKeyID('');
        }
    };

    const handleSetFlag = async (ID: string, flagAction: FlagAction) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        const addressDisplayKey = getKeyByID(addressKeysDisplay, ID);

        if (!addressDisplayKey || !Address) {
            throw new Error('Key not found');
        }

        try {
            setLoadingKeyID(ID);
            await setAddressKeyFlags(
                api,
                Address,
                addressKeys,
                ID,
                getNewKeyFlags(addressDisplayKey.flags, flagAction),
                keyTransparencyVerify
            );
            await keyTransparencyCommit(userKeys);
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
        if (isLoadingKey || !addressKeys) {
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
            await deleteAddressKey(api, Address, addressKeys, ID, keyTransparencyVerify);
            await keyTransparencyCommit(userKeys);
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

    const onAdd = async (encryptionConfig: EncryptionConfig) => {
        if (!Address || !addressKeys) {
            throw new Error('Missing address or address keys');
        }
        const [newKey] = await addAddressKeysProcess({
            api,
            userKeys,
            encryptionConfig,
            addresses: Addresses,
            address: Address,
            addressKeys: addressKeys,
            keyPassword: authentication.getPassword(),
            keyTransparencyVerify,
        });
        await Promise.all([
            resignSKLWithPrimaryKey({
                address: Address,
                newPrimaryKey: newKey.privateKey,
                formerPrimaryKey: addressKeys[0].publicKey,
                userKeys,
            }),
            keyTransparencyCommit(userKeys),
        ]);
        await call();
        return newKey.fingerprint;
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
        if (!Address || !addressKeys) {
            throw new Error('Missing address or address keys');
        }
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
        await keyTransparencyCommit(userKeys);
        return call();
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

    const { isSubUser, isPrivate } = User;
    const hasDecryptedUserKeys = userKeys?.length > 0;

    const canAdd = !isSubUser && isPrivate && hasDecryptedUserKeys;
    const canImport = canAdd;

    const allKeysToReactivate = getAllKeysReactivationRequests(addressesKeys, User, userKeys);

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
                {!!allKeysToReactivate.length && (
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
                <AddKeyModal type="address" existingAlgorithms={existingAlgorithms} onAdd={onAdd} {...addKeyProps} />
            )}
            {renderImportKey && <ImportKeyModal onProcess={onProcessImport} {...importKeyProps} />}
            {renderReactivateKey && (
                <ReactivateKeysModal
                    userKeys={userKeys}
                    keyReactivationRequests={allKeysToReactivate}
                    onProcess={async (keyReactivationRecords, onReactivation) => {
                        await reactivateKeysProcess({
                            api,
                            user: User,
                            userKeys,
                            addresses: Addresses,
                            keyReactivationRecords,
                            keyPassword: authentication.getPassword(),
                            onReactivation,
                            keyTransparencyVerify,
                        });
                        await keyTransparencyCommit(userKeys).catch(noop);
                        return call();
                    }}
                    {...reactivateKeyProps}
                />
            )}
            {children}
        </>
    );
};

export default AddressKeysSection;
