import { ChangeEvent, useEffect, useState } from 'react';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import {
    reactivateKeysProcess,
    importKeysProcess,
    deleteAddressKey,
    setPrimaryAddressKey,
    addAddressKeysProcess,
    setAddressKeyFlags,
} from '@proton/shared/lib/keys';

import { Loader, Button } from '../../components';
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

import { SettingsSectionWide, SettingsParagraph } from '../account';

import { getAllKeysReactivationRequests, getKeysToReactivateCount } from './reactivateKeys/getAllKeysToReactive';
import AddressKeysHeaderActions from './AddressKeysHeaderActions';
import KeysTable from './KeysTable';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';
import useDisplayKeys from './shared/useDisplayKeys';
import AddKeyModal from './addKey/AddKeyModal';
import ImportKeyModal from './importKeys/ImportKeyModal';
import { getNewKeyFlags } from './shared/flags';
import { FlagAction } from './shared/interface';
import { KeyReactivationRequest } from './reactivateKeys/interface';
import { getKeyByID } from './shared/helper';

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

    useEffect(() => {
        if (addressIndex === -1 && Array.isArray(Addresses)) {
            setAddressIndex(0);
        }
    }, [addressIndex, Addresses]);

    if (addressIndex === -1 || loadingAddresses) {
        return (
            <SettingsSectionWide>
                <Loader />
            </SettingsSectionWide>
        );
    }

    if (!Array.isArray(Addresses) || !Addresses.length) {
        return <SettingsParagraph>{c('Info').t`No addresses exist`}</SettingsParagraph>;
    }

    if (loadingAddressesKeys && !Array.isArray(addressKeys)) {
        return (
            <SettingsSectionWide>
                <Loader />
            </SettingsSectionWide>
        );
    }

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
            await setPrimaryAddressKey(api, Address, addressKeys, ID);
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
                getNewKeyFlags(addressDisplayKey.flags, flagAction)
            );
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
            await deleteAddressKey(api, Address, addressKeys, ID);
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

        return createModal(
            <DeleteKeyModal
                onDelete={onDelete}
                onExport={privateKey ? onExport : undefined}
                fingerprint={fingerprint}
            />
        );
    };

    const handleAddKey = () => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        if (!Address) {
            throw new Error('Keys not found');
        }

        const existingAlgorithms = addressKeysDisplay.map(({ algorithmInfo }) => algorithmInfo).filter(isTruthy);
        createModal(
            <AddKeyModal
                existingAlgorithms={existingAlgorithms}
                onAdd={async (encryptionConfig) => {
                    const [newKey] = await addAddressKeysProcess({
                        api,
                        userKeys,
                        encryptionConfig,
                        addresses: Addresses,
                        address: Address,
                        addressKeys,
                        keyPassword: authentication.getPassword(),
                    });
                    await call();
                    return newKey.fingerprint;
                }}
            />
        );
    };

    const handleImportKey = () => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        if (!Address) {
            throw new Error('Keys not found');
        }
        createModal(
            <ImportKeyModal
                onProcess={async (keyImportRecords, cb) => {
                    await importKeysProcess({
                        api,
                        address: Address,
                        addressKeys,
                        addresses: Addresses,
                        userKeys,
                        keyImportRecords,
                        keyPassword: authentication.getPassword(),
                        onImport: cb,
                    });
                    return call();
                }}
            />
        );
    };

    const handleExportPrivate = (ID: string) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        const decryptedAddressKey = getKeyByID(addressKeys, ID);
        if (!decryptedAddressKey) {
            throw new Error('Key not found');
        }
        return createModal(<ExportPrivateKeyModal name={addressEmail} privateKey={decryptedAddressKey.privateKey} />);
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
        return createModal(
            <ExportPublicKeyModal
                name={addressEmail}
                fallbackPrivateKey={Key.PrivateKey}
                publicKey={decryptedAddressKey?.publicKey}
            />
        );
    };

    const handleReactivateKeys = (keyReactivationRequests: KeyReactivationRequest[]) => {
        return createModal(
            <ReactivateKeysModal
                keyReactivationRequests={keyReactivationRequests}
                onProcess={async (keyReactivationRecords, oldPassword, onReactivation) => {
                    await reactivateKeysProcess({
                        api,
                        user: User,
                        userKeys,
                        addresses: Addresses,
                        keyReactivationRecords,
                        keyPassword: authentication.getPassword(),
                        onReactivation,
                    });
                    return call();
                }}
            />
        );
    };

    const handleReactivateKey = (ID: string) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        const Key = getKeyByID(Address?.Keys || [], ID);
        if (!Address || !Key) {
            throw new Error('Key not found');
        }
        return handleReactivateKeys([
            {
                address: Address,
                keys: addressKeys,
                keysToReactivate: [Key],
            },
        ]);
    };

    const allKeysToReactivate = getAllKeysReactivationRequests(addressesKeys, User, userKeys);
    const numberOfKeysToReactivate = getKeysToReactivateCount(allKeysToReactivate);

    const { isSubUser, isPrivate } = User;
    const canReactivate = !isSubUser && numberOfKeysToReactivate >= 1;

    const canAdd = !isSubUser && isPrivate;
    const canImport = canAdd;

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info').t`Download your PGP keys for use with other PGP-compatible services.`}
            </SettingsParagraph>
            {canReactivate && (
                <div className="mb1">
                    <Button
                        color="norm"
                        onClick={() => {
                            if (!isLoadingKey) {
                                handleReactivateKeys(allKeysToReactivate);
                            }
                        }}
                    >
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
                onReactivateKey={handleReactivateKey}
                onDeleteKey={handleDeleteKey}
                onSetPrimary={handleSetPrimaryKey}
                onSetCompromised={handleSetCompromised}
                onSetNotCompromised={handleSetNotCompromised}
                onSetObsolete={handleSetObsolete}
                onSetNotObsolete={handleSetNotObsolete}
            />
        </SettingsSectionWide>
    );
};

export default AddressKeysSection;
