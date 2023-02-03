import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AlgorithmInfo, CryptoProxy } from '@proton/crypto';
import { EncryptionConfig } from '@proton/shared/lib/interfaces';
import { addUserKeysProcess } from '@proton/shared/lib/keys';
import { storeDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';

import { Loader, useModalState } from '../../components';
import {
    useApi,
    useAuthentication,
    useEventManager,
    useIsDeviceRecoveryAvailable,
    useIsDeviceRecoveryEnabled,
    useModals,
    useUser,
    useUserKeys,
} from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import KeysTable from './KeysTable';
import AddKeyModal from './addKey/AddKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import { getKeyByID } from './shared/helper';
import useDisplayKeys from './shared/useDisplayKeys';

const UserKeysSections = () => {
    const { createModal } = useModals();
    const [User] = useUser();
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const [userKeys, loadingUserKeys] = useUserKeys();
    const userKeysDisplay = useDisplayKeys({ keys: userKeys, User });
    const [isDeviceRecoveryAvailable, loadingDeviceRecovery] = useIsDeviceRecoveryAvailable();
    const isDeviceRecoveryEnabled = useIsDeviceRecoveryEnabled();

    const existingAlgorithms = userKeysDisplay.reduce<AlgorithmInfo[]>(
        (acc, { algorithmInfos }) => acc.concat(algorithmInfos),
        []
    );

    const [addKeyProps, setAddKeyModalOpen, renderAddKey] = useModalState();

    const { Name: userName } = User;

    const handleExportPrivate = (ID: string) => {
        const userKey = getKeyByID(userKeys, ID);
        if (!userKey?.privateKey) {
            throw new Error('Could not find key');
        }
        createModal(<ExportPrivateKeyModal name={userName} privateKey={userKey.privateKey} />);
    };

    const handleExportPublic = (ID: string) => {
        const userKey = getKeyByID(userKeys, ID);
        const Key = getKeyByID(User.Keys, ID);
        if (!Key) {
            throw new Error('Could not find key');
        }
        createModal(
            <ExportPublicKeyModal name={userName} fallbackPrivateKey={Key.PrivateKey} publicKey={userKey?.publicKey} />
        );
    };

    const handleAddKey = () => {
        if (!userKeys) {
            return;
        }
        setAddKeyModalOpen(true);
    };

    const onAdd = async (encryptionConfig: EncryptionConfig) => {
        const newKey = await addUserKeysProcess({
            api,
            encryptionConfig,
            passphrase: authentication.getPassword(),
        });

        // Store a new device recovery immediately to avoid having the storing trigger asynchronously which would cause red notification flashes
        if (isDeviceRecoveryAvailable && isDeviceRecoveryEnabled) {
            const publicKey = await CryptoProxy.importPublicKey({
                binaryKey: await CryptoProxy.exportPublicKey({ key: newKey, format: 'binary' }),
            });
            await storeDeviceRecovery({
                api,
                user: User,
                userKeys: [{ ID: 'tmp-id', privateKey: newKey, publicKey }, ...userKeys],
            });
        }
        await call();
        return newKey.getFingerprint();
    };

    const canGenerateUserKey = !User.isSubUser && User.isPrivate && userKeysDisplay.length < 20;

    const children = (() => {
        if (loadingDeviceRecovery || (loadingUserKeys && !Array.isArray(userKeys))) {
            return (
                <SettingsSectionWide>
                    <Loader />
                </SettingsSectionWide>
            );
        }

        // E.g. vpn user
        if (!userKeysDisplay.length) {
            return (
                <SettingsSectionWide>
                    <SettingsParagraph>{c('Info').t`No contact encryption keys exist`}</SettingsParagraph>
                </SettingsSectionWide>
            );
        }

        return (
            <SettingsSectionWide>
                {canGenerateUserKey && (
                    <div className="mb1">
                        <Button shape="outline" onClick={handleAddKey} data-testid="generateUserKey">
                            {c('Action').t`Generate key`}
                        </Button>
                    </div>
                )}
                <KeysTable
                    keys={userKeysDisplay}
                    onExportPrivateKey={handleExportPrivate}
                    onExportPublicKey={handleExportPublic}
                />
            </SettingsSectionWide>
        );
    })();

    return (
        <>
            {renderAddKey && (
                <AddKeyModal type="user" existingAlgorithms={existingAlgorithms} onAdd={onAdd} {...addKeyProps} />
            )}
            {children}
        </>
    );
};

export default UserKeysSections;
