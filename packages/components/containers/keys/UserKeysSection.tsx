import { c } from 'ttag';
import { addUserKeysProcess } from '@proton/shared/lib/keys';
import { EncryptionConfig } from '@proton/shared/lib/interfaces';
import { AlgorithmInfo } from '@proton/crypto';

import { Button, Loader, useModalState } from '../../components';
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
        await call();
        return newKey.getFingerprint();
    };

    const canGenerateUserKey = !User.isSubUser && User.isPrivate && userKeysDisplay.length < 20;

    const children = (() => {
        if (loadingUserKeys && !Array.isArray(userKeys)) {
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
