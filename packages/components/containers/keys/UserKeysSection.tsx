import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AlgorithmInfo } from '@proton/crypto';
import { EncryptionConfig } from '@proton/shared/lib/interfaces';
import { addUserKeysProcess } from '@proton/shared/lib/keys';

import { Loader, useModalState } from '../../components';
import {
    useApi,
    useAuthentication,
    useEventManager,
    useGetAddresses,
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
    const getAddresses = useGetAddresses();

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

    const handleAddKey = () => {
        if (!userKeys) {
            return;
        }
        setAddKeyModalOpen(true);
    };

    const onAdd = async (encryptionConfig: EncryptionConfig) => {
        const addresses = await getAddresses();

        const newKey = await addUserKeysProcess({
            api,
            user: User,
            isDeviceRecoveryAvailable,
            isDeviceRecoveryEnabled,
            call,
            encryptionConfig,
            userKeys,
            addresses,
            passphrase: authentication.getPassword(),
        });

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
                    <SettingsParagraph>{c('Info').t`No account keys exist`}</SettingsParagraph>
                </SettingsSectionWide>
            );
        }

        return (
            <SettingsSectionWide>
                {canGenerateUserKey && (
                    <div className="mb-4">
                        <Button shape="outline" onClick={handleAddKey} data-testid="generateUserKey">
                            {c('Action').t`Generate key`}
                        </Button>
                    </div>
                )}
                <KeysTable keys={userKeysDisplay} onExportPrivateKey={handleExportPrivate} />
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
