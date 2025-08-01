import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetOrganizationKey } from '@proton/account/organizationKey/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useIsDeviceRecoveryAvailable, useIsDeviceRecoveryEnabled } from '@proton/components/hooks/useDeviceRecovery';
import useEventManager from '@proton/components/hooks/useEventManager';
import useModals from '@proton/components/hooks/useModals';
import type { KeyGenConfig } from '@proton/shared/lib/interfaces';
import { addUserKeysProcess } from '@proton/shared/lib/keys';

import KeysTable from './KeysTable';
import AddKeyModal from './addKey/AddKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import { getKeyByID } from './shared/helper';
import { useKeysMetadata } from './shared/useKeysMetadata';

const UserKeysSections = () => {
    const { createModal } = useModals();
    const [User] = useUser();
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const [userKeys, loadingUserKeys] = useUserKeys();
    const getOrganizationKey = useGetOrganizationKey();
    const [isDeviceRecoveryAvailable, loadingDeviceRecovery] = useIsDeviceRecoveryAvailable();
    const isDeviceRecoveryEnabled = useIsDeviceRecoveryEnabled();
    const getAddresses = useGetAddresses();

    const {
        user: { displayKeys: userKeysDisplay, existingAlgorithms },
    } = useKeysMetadata({
        user: User,
        userKeys,
    });

    const [addKeyProps, setAddKeyModalOpen, renderAddKey] = useModalState();

    const { Name: userName } = User;

    const handleExportPrivate = (ID: string) => {
        if (!userKeys) {
            throw new Error('Missing keys');
        }
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

    const onAdd = async (keyGenConfig: KeyGenConfig) => {
        if (!userKeys) {
            throw new Error('Missing keys');
        }
        const [addresses, organizationKey] = await Promise.all([getAddresses(), getOrganizationKey()]);

        try {
            stop();
            const newKey = await addUserKeysProcess({
                api,
                user: User,
                organizationKey,
                isDeviceRecoveryAvailable,
                isDeviceRecoveryEnabled,
                keyGenConfig,
                userKeys,
                addresses,
                passphrase: authentication.getPassword(),
            });
            await call();
            return newKey.getFingerprint();
        } finally {
            start();
        }
    };

    const canGenerateUserKey = User.isSelf && User.isPrivate && userKeysDisplay.length < 20;

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
