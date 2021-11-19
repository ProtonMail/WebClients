import { c } from 'ttag';
import { addUserKeysProcess } from '@proton/shared/lib/keys';
import { algorithmInfo } from 'pmcrypto';

import { Button, Loader } from '../../components';
import { useUser, useModals, useUserKeys, useApi, useEventManager, useAuthentication } from '../../hooks';

import { SettingsParagraph, SettingsSectionWide } from '../account';

import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import KeysTable from './KeysTable';
import useDisplayKeys from './shared/useDisplayKeys';
import { getKeyByID } from './shared/helper';
import AddKeyModal from './addKey/AddKeyModal';

const UserKeysSections = () => {
    const { createModal } = useModals();
    const [User] = useUser();
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const [userKeys, loadingUserKeys] = useUserKeys();
    const userKeysDisplay = useDisplayKeys({ keys: userKeys, User });

    if (loadingUserKeys && !Array.isArray(userKeys)) {
        return (
            <SettingsSectionWide>
                <Loader />
            </SettingsSectionWide>
        );
    }

    // E.g. vpn user
    if (!userKeysDisplay.length) {
        return <SettingsParagraph>{c('Info').t`No contact encryption keys exist`}</SettingsParagraph>;
    }

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

        const existingAlgorithms = userKeysDisplay.reduce<algorithmInfo[]>(
            (acc, { algorithmInfos }) => acc.concat(algorithmInfos),
            []
        );
        createModal(
            <AddKeyModal
                type="user"
                existingAlgorithms={existingAlgorithms}
                onAdd={async (encryptionConfig) => {
                    const newKey = await addUserKeysProcess({
                        api,
                        encryptionConfig,
                        passphrase: authentication.getPassword(),
                    });
                    await call();
                    return newKey.getFingerprint();
                }}
            />
        );
    };

    const canGenerateUserKey = userKeysDisplay.length < 20;

    return (
        <SettingsSectionWide>
            {canGenerateUserKey && (
                <div className="mb1">
                    <Button shape="outline" onClick={handleAddKey}>
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
};

export default UserKeysSections;
