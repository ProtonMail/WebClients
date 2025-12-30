import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { addressThunk, useInactiveKeys } from '@proton/account';
import { useAddressesKeys } from '@proton/account/addressKeys/hooks';
import { setAddressKeyFlagAction } from '@proton/account/addressKeys/setAddressKeyFlagAction';
import { useAddresses } from '@proton/account/addresses/hooks';
import { getKTActivation } from '@proton/account/kt/actions';
import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useModals from '@proton/components/hooks/useModals';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency';
import { useOutgoingAddressForwardings } from '@proton/mail/store/forwarding/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { CacheType } from '@proton/redux-utilities';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import { deleteAddressKey, getPrimaryAddressKeysForSigning, setPrimaryAddressKey } from '@proton/shared/lib/keys';
import { FlagAction } from '@proton/shared/lib/keys/getNewAddressKeyFlags';

import AddressKeysHeaderActions from './AddressKeysHeaderActions';
import KeysTable from './KeysTable';
import AddKeyModal from './addKey/AddKeyModal';
import ChangePrimaryKeyForwardingNoticeModal from './changePrimaryKeyForwardingNotice/ChangePrimaryKeyForwardingNoticeModal';
import DeleteKeyModal from './deleteKey/DeleteKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ImportKeyModal from './importKeys/ImportKeyModal';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import { getKeyByID } from './shared/helper';
import { useKeysMetadata } from './shared/useKeysMetadata';

const AddressKeysSection = () => {
    const { createModal } = useModals();
    const api = useApi();
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeys] = useUserKeys();
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys();
    const [loadingKeyID, setLoadingKeyID] = useState<string>('');
    const [maybeAddressIndex, setAddressIndex] = useState(-1);
    const createKTVerifier = useKTVerifier();
    const keyReactivationRequests = useInactiveKeys();
    const dispatch = useDispatch();
    const [outgoingAddressForwardings = [], loadingOutgoingAddressForwardings] = useOutgoingAddressForwardings();

    const addressIndex = maybeAddressIndex === -1 ? 0 : maybeAddressIndex;

    const Address = Addresses ? Addresses[addressIndex] : undefined;
    const { ID: addressID = '', Email: addressEmail = '' } = Address || {};
    const addressWithKeys = addressesKeys?.find(({ address }) => address.ID === addressID);
    const addressKeys = addressWithKeys?.keys;
    const handleError = useErrorHandler();

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
    const [exportPrivateKeyProps, setExportPrivateKeyOpen, renderExportPrivateKey] = useModalState();
    const [exportPublicKeyProps, setExportPublicKeyOpen, renderExportPublicKey] = useModalState();
    const [tmpId, setTmpId] = useState('');

    const isLoadingKey = loadingKeyID !== '';
    const outgoingE2EEForwardings =
        loadingOutgoingAddressForwardings || !Address
            ? []
            : outgoingAddressForwardings.filter(
                  ({ Type, ForwarderAddressID, State }) =>
                      Type === ForwardingType.InternalEncrypted &&
                      ForwarderAddressID === Address.ID &&
                      // these states are already inactive and require re-confirmation by the forwardee, so we ignore them
                      State !== ForwardingState.Outdated &&
                      State !== ForwardingState.Rejected
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
                await dispatch(addressThunk({ address: Address, cache: CacheType.None }));
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
            await dispatch(setAddressKeyFlagAction({ address: Address, addressKeyID: ID, flagAction }));
        } catch (e) {
            handleError(e);
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
            await dispatch(addressThunk({ address: Address, cache: CacheType.None }));
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

    const handleImportKey = () => {
        if (isLoadingKey || !addressKeys || !userKeys) {
            return;
        }
        if (!Address) {
            throw new Error('Keys not found');
        }
        setImportKeyModalOpen(true);
    };

    const handleExportPrivate = (ID: string) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        setExportPrivateKeyOpen(true);
        setTmpId(ID);
    };

    const handleExportPublic = (ID: string) => {
        if (isLoadingKey || !addressKeys) {
            return;
        }
        setExportPublicKeyOpen(true);
        setTmpId(ID);
    };

    const { isSelf, isPrivate } = User;
    const hasDecryptedUserKeys = (userKeys?.length || 0) > 0;

    const canAdd = isSelf && isPrivate && hasDecryptedUserKeys;
    const canReactivate = isSelf;
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
                {canReactivate && !!keyReactivationRequests.length && (
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

    const tmpDecryptedAddressKey = getKeyByID(addressKeys || [], tmpId);
    const tmpAddressKey = getKeyByID(Address?.Keys || [], tmpId);

    return (
        <>
            {renderAddKey && Address && (
                <AddKeyModal
                    target={{
                        type: 'address',
                        address: Address,
                        hasOutgoingE2EEForwardings: hasOutgoingE2EEForwardings,
                        emailAddress: Address?.Email,
                    }}
                    existingAlgorithms={existingAlgorithms}
                    {...addKeyProps}
                />
            )}
            {renderImportKey && Address && (
                <ImportKeyModal
                    hasOutgoingE2EEForwardings={hasOutgoingE2EEForwardings}
                    address={Address}
                    {...importKeyProps}
                />
            )}
            {renderReactivateKey && (
                <ReactivateKeysModal
                    userKeys={userKeys || []}
                    keyReactivationRequests={keyReactivationRequests}
                    {...reactivateKeyProps}
                />
            )}
            {renderExportPublicKey && tmpAddressKey && (
                <ExportPublicKeyModal
                    name={addressEmail}
                    fallbackPrivateKey={tmpAddressKey.PrivateKey}
                    publicKey={tmpDecryptedAddressKey?.publicKey}
                    {...exportPublicKeyProps}
                    onExit={() => {
                        setTmpId('');
                        exportPublicKeyProps.onExit();
                    }}
                />
            )}
            {renderExportPrivateKey && tmpDecryptedAddressKey && (
                <ExportPrivateKeyModal
                    name={addressEmail}
                    privateKey={tmpDecryptedAddressKey.privateKey}
                    {...exportPrivateKeyProps}
                    onExit={() => {
                        setTmpId('');
                        exportPrivateKeyProps.onExit();
                    }}
                />
            )}
            {children}
        </>
    );
};

export default AddressKeysSection;
