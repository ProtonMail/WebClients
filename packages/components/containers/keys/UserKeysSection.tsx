import { c } from 'ttag';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import { Button, Loader } from '../../components';
import { useUser, useModals, useUserKeys } from '../../hooks';

import { SettingsParagraph, SettingsSectionWide } from '../account';

import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import KeysTable from './KeysTable';
import useDisplayKeys from './shared/useDisplayKeys';
import { getKeyByID } from './shared/helper';

const UserKeysSections = () => {
    const { createModal } = useModals();
    const [User] = useUser();
    const [userKeys, loadingUserKeys] = useUserKeys();
    const userKeysDisplay = useDisplayKeys({ keys: userKeys, User });

    if (loadingUserKeys || !Array.isArray(userKeys)) {
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

    const primaryPrivateKey = getPrimaryKey(userKeys);
    const canExportPrimaryPrivateKey = !!primaryPrivateKey?.privateKey;

    return (
        <SettingsSectionWide>
            {canExportPrimaryPrivateKey && (
                <div className="mb1">
                    <Button
                        shape="outline"
                        onClick={() => {
                            if (!primaryPrivateKey?.privateKey) {
                                return;
                            }
                            createModal(
                                <ExportPrivateKeyModal name={userName} privateKey={primaryPrivateKey.privateKey} />
                            );
                        }}
                    >
                        {c('Action').t`Export private key`}
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
