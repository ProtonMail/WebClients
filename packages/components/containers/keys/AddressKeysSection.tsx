import React, { ChangeEvent, useEffect, useState } from 'react';
import { c } from 'ttag';
import { removeKeyAction, setFlagsKeyAction, setPrimaryKeyAction } from 'proton-shared/lib/keys/keysAction';
import getActionableKeysList from 'proton-shared/lib/keys/getActionableKeysList';
import { generateAddressKey } from 'proton-shared/lib/keys/keys';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';
import { removeKeyRoute, setKeyFlagsRoute, setKeyPrimaryRoute } from 'proton-shared/lib/api/keys';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';
import getCachedKeyByID from 'proton-shared/lib/keys/getCachedKeyByID';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { EncryptionConfig } from 'proton-shared/lib/interfaces';
import getParsedKeys from 'proton-shared/lib/keys/getParsedKeys';

import { Alert, Block, Loader, PrimaryButton, Select } from '../../components';
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

import { getAllKeysToReactivate, getKeysToReactivateCount } from './reactivateKeys/getAllKeysToReactive';
import AddressKeysHeaderActions from './AddressKeysHeaderActions';
import KeysTable from './KeysTable';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';
import useDisplayKeys from './shared/useDisplayKeys';
import AddKeyModal from './addKey/AddKeyModal';
import createKeyHelper from './addKey/createKeyHelper';
import importKeysProcess from './importKeys/importKeysProcess';
import ImportKeyModal from './importKeys/ImportKeyModal';
import { OnProcessArguments as ImportProcessArguments } from './importKeys/interface';
import { getNewKeyFlags } from './shared/flags';
import { FlagAction, KeyDisplay } from './shared/interface';
import reactivateKeysProcess from './reactivateKeys/reactivateKeysProcess';
import { KeyReactivation, OnProcessArguments as ReactivateProcessArguments } from './reactivateKeys/interface';

const getDisplayKeyByID = (keys: KeyDisplay[], ID: string) => {
    return keys.find(({ ID: otherID }) => ID === otherID);
};

const AddressKeysSection = () => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeysList] = useUserKeys();
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys();
    const [loadingKeyID, setLoadingKeyID] = useState<string>('');
    const [addressIndex, setAddressIndex] = useState(() => (Array.isArray(Addresses) ? 0 : -1));

    const Address = Addresses ? Addresses[addressIndex] : undefined;
    const { ID: addressID = '', Email: addressEmail = '' } = Address || {};
    const addressKeys = addressesKeysMap && addressesKeysMap[addressID];
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
        return <Loader />;
    }

    if (!Array.isArray(Addresses) || !Addresses.length) {
        return <Alert>{c('Info').t`No addresses exist`}</Alert>;
    }

    if (loadingAddressesKeys && !Array.isArray(addressKeys)) {
        return <Loader />;
    }

    const isLoadingKey = loadingKeyID !== '';

    const handleSetPrimaryKey = async (ID: string) => {
        const addressKey = getCachedKeyByID(addressKeys, ID);
        if (!addressKey || isLoadingKey || !addressKey.privateKey) {
            return;
        }
        const { privateKey: newPrimaryKew } = addressKey;

        const process = async () => {
            const updatedKeys = setPrimaryKeyAction({
                actionableKeys: await getActionableKeysList(addressKeys),
                ID,
            });
            await api(
                setKeyPrimaryRoute({
                    ID,
                    SignedKeyList: await getSignedKeyList(updatedKeys, newPrimaryKew),
                })
            );
            await call();
        };

        try {
            setLoadingKeyID(ID);
            await process();
        } finally {
            setLoadingKeyID('');
        }
    };

    const handleSetFlag = async (ID: string, flagAction: FlagAction) => {
        const addressKey = getCachedKeyByID(addressKeys, ID);
        if (!addressKey || isLoadingKey) {
            return;
        }
        const { privateKey: primaryPrivateKey, Key } = getPrimaryKey(addressKeys) || {};
        if (!primaryPrivateKey || !Key) {
            return;
        }

        const process = async () => {
            const newKeyFlags = getNewKeyFlags(addressKey.Key.Flags, flagAction);
            const updatedKeys = setFlagsKeyAction({
                actionableKeys: await getActionableKeysList(addressKeys),
                ID,
                flags: newKeyFlags,
            });
            await api(
                setKeyFlagsRoute({
                    ID,
                    Flags: newKeyFlags,
                    SignedKeyList: await getSignedKeyList(updatedKeys, primaryPrivateKey),
                })
            );
            await call();
        };

        try {
            setLoadingKeyID(ID);
            await process();
        } finally {
            setLoadingKeyID('');
        }
    };

    const handleSetObsolete = (ID: string) => handleSetFlag(ID, FlagAction.MARK_OBSOLETE);
    const handleSetNotObsolete = (ID: string) => handleSetFlag(ID, FlagAction.MARK_NOT_OBSOLETE);
    const handleSetCompromised = (ID: string) => handleSetFlag(ID, FlagAction.MARK_COMPROMISED);
    const handleSetNotCompromised = (ID: string) => handleSetFlag(ID, FlagAction.MARK_NOT_COMPROMISED);

    const handleDeleteKey = (ID: string) => {
        const addressKey = getCachedKeyByID(addressKeys, ID);
        const addressDisplayKey = getDisplayKeyByID(addressKeysDisplay, ID);
        if (!addressDisplayKey || !addressKey || isLoadingKey) {
            return;
        }
        const { privateKey } = addressKey;
        const { privateKey: primaryPrivateKey } = getPrimaryKey(addressKeys) || {};
        if (!primaryPrivateKey) {
            return;
        }

        const { fingerprint } = addressDisplayKey;

        const onDelete = async (): Promise<void> => {
            const updatedKeys = removeKeyAction({
                actionableKeys: await getActionableKeysList(addressKeys),
                ID,
            });
            const signedKeyList = await getSignedKeyList(updatedKeys, primaryPrivateKey);
            await api(removeKeyRoute({ ID, SignedKeyList: signedKeyList }));
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
        if (isLoadingKey || !Address) {
            return;
        }
        const { privateKey: primaryPrivateKey } = getPrimaryKey(addressKeys) || {};

        const onAdd = async (encryptionConfig: EncryptionConfig): Promise<string> => {
            const { privateKey, privateKeyArmored } = await generateAddressKey({
                email: Address.Email,
                passphrase: authentication.getPassword(),
                encryptionConfig,
            });
            // If there is no primary private key, assume there exists no keys and this new key should be used to sign
            const signingKey = primaryPrivateKey || privateKey;
            await createKeyHelper({
                api,
                privateKeyArmored,
                privateKey,
                Address,
                parsedKeys: await getParsedKeys(addressKeys),
                actionableKeys: await getActionableKeysList(addressKeys),
                signingKey,
            });
            await call();
            return privateKey.getFingerprint();
        };

        const existingAlgorithms = addressKeysDisplay.map(({ algorithmInfo }) => algorithmInfo).filter(isTruthy);
        createModal(<AddKeyModal existingAlgorithms={existingAlgorithms} onAdd={onAdd} />);
    };

    const handleImportKey = () => {
        if (isLoadingKey || !Address) {
            return;
        }
        const { privateKey: primaryPrivateKey } = getPrimaryKey(addressKeys) || {};

        const onProcess = async ({ keysToImport, setKeysToImport }: ImportProcessArguments) => {
            await importKeysProcess({
                keysToImport,
                setKeysToImport,
                api,
                password: authentication.getPassword(),
                actionableKeys: await getActionableKeysList(addressKeys),
                parsedKeys: await getParsedKeys(addressKeys),
                signingKey: primaryPrivateKey,
                Address,
            });
            await call();
        };

        createModal(<ImportKeyModal onProcess={onProcess} />);
    };

    const handleExportPrivate = (ID: string) => {
        const addressKey = getCachedKeyByID(addressKeys, ID);
        if (!addressKey || !addressKey.privateKey || isLoadingKey) {
            return;
        }
        return createModal(<ExportPrivateKeyModal name={addressEmail} privateKey={addressKey.privateKey} />);
    };

    const handleExportPublic = (ID: string) => {
        const addressKey = getCachedKeyByID(addressKeys, ID);
        if (!addressKey || isLoadingKey) {
            return;
        }
        return createModal(
            <ExportPublicKeyModal
                name={addressEmail}
                PrivateKey={addressKey.Key.PrivateKey}
                publicKey={addressKey.publicKey}
            />
        );
    };

    const handleReactivateKeys = (initialKeysToReactivate: KeyReactivation[]) => {
        const onProcess = async ({
            keysToReactivate,
            setKeysToReactivate,
            isUploadMode,
            oldPassword,
        }: ReactivateProcessArguments) => {
            await reactivateKeysProcess({
                api,
                keysToReactivate,
                setKeysToReactivate,
                isUploadMode,
                newPassword: authentication.getPassword(),
                oldPassword,
                addressesKeysMap,
                userKeysList,
            });
            await call();
        };
        return createModal(<ReactivateKeysModal onProcess={onProcess} allKeys={initialKeysToReactivate} />);
    };

    const handleReactivateKey = (ID: string) => {
        const addressKey = getCachedKeyByID(addressKeys, ID);
        if (!addressKey || isLoadingKey) {
            return;
        }
        return handleReactivateKeys([
            {
                Address,
                keys: [addressKey],
            },
        ]);
    };

    const allInactiveKeys = getAllKeysToReactivate({ Addresses, User, addressesKeysMap, userKeysList });
    const totalInactiveKeys = getKeysToReactivateCount(allInactiveKeys);

    const { isSubUser, isPrivate } = User;
    const canReactivate = !isSubUser && totalInactiveKeys >= 1;

    const canAdd = !isSubUser && isPrivate;
    const canImport = canAdd;

    const primaryPrivateKey = getPrimaryKey(addressKeys);
    const canExportPrimaryPrivateKey = !!primaryPrivateKey?.privateKey;
    const canExportPrimaryPublicKey = !!primaryPrivateKey;

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/pgp-key-management/">
                {c('Info')
                    .t`Download your PGP Keys for use with other PGP compatible services. Only incoming messages in inline OpenPGP format are currently supported.`}
            </Alert>
            {canReactivate && (
                <Block>
                    <PrimaryButton
                        onClick={() => {
                            if (!isLoadingKey) {
                                handleReactivateKeys(allInactiveKeys);
                            }
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
                        onChange={({ target: { value } }: ChangeEvent<HTMLSelectElement>) =>
                            !isLoadingKey && setAddressIndex(+value)
                        }
                    />
                </Block>
            )}
            <AddressKeysHeaderActions
                onAddKey={canAdd ? handleAddKey : undefined}
                onImportKey={canImport ? handleImportKey : undefined}
                onExportPrivate={
                    canExportPrimaryPrivateKey && primaryPrivateKey
                        ? () => handleExportPrivate(primaryPrivateKey.Key.ID)
                        : undefined
                }
                onExportPublic={
                    canExportPrimaryPublicKey && primaryPrivateKey
                        ? () => handleExportPublic(primaryPrivateKey.Key.ID)
                        : undefined
                }
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
        </>
    );
};

export default AddressKeysSection;
