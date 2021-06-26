import React from 'react';
import { c } from 'ttag';
import { getPrimaryKey, reactivateKeysProcess } from '@proton/shared/lib/keys';

import { Button, Loader } from '../../components';
import {
    useUser,
    useModals,
    useUserKeys,
    useEventManager,
    useAuthentication,
    useApi,
    useGetAddresses,
} from '../../hooks';

import { SettingsParagraph, SettingsSectionWide } from '../account';

import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import KeysTable from './KeysTable';
import useDisplayKeys from './shared/useDisplayKeys';
import { KeyReactivationRequest } from './reactivateKeys/interface';
import { getKeyByID } from './shared/helper';

const UserKeysSections = () => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const authentication = useAuthentication();
    const [User] = useUser();
    const [userKeys, loadingUserKeys] = useUserKeys();
    const getAddresses = useGetAddresses();
    const userKeysDisplay = useDisplayKeys({ keys: userKeys, User });

    if (loadingUserKeys || !Array.isArray(userKeys)) {
        return (
            <SettingsSectionWide>
                <Loader />
            </SettingsSectionWide>
        );
    }

    // E.g. vpn user
    if (!userKeys.length) {
        return <SettingsParagraph>{c('Info').t`No contact encryption keys exist`}</SettingsParagraph>;
    }

    const { Name: userName } = User;

    const handleExportPrivate = (ID: string) => {
        const userKey = getKeyByID(userKeys, ID);
        if (!userKey?.privateKey) {
            throw new Error('Could not find key');
        }
        return createModal(<ExportPrivateKeyModal name={userName} privateKey={userKey.privateKey} />);
    };

    const handleExportPublic = (ID: string) => {
        const userKey = getKeyByID(userKeys, ID);
        const Key = getKeyByID(User.Keys, ID);
        if (!Key) {
            throw new Error('Could not find key');
        }
        return createModal(
            <ExportPublicKeyModal name={userName} fallbackPrivateKey={Key.PrivateKey} publicKey={userKey?.publicKey} />
        );
    };

    const handleReactivateKeys = async (keyReactivationRequests: KeyReactivationRequest[]) => {
        const addresses = await getAddresses();
        return createModal(
            <ReactivateKeysModal
                keyReactivationRequests={keyReactivationRequests}
                onProcess={async (keyReactivationRecords, oldPassword, cb) => {
                    await reactivateKeysProcess({
                        api,
                        user: User,
                        userKeys,
                        addresses,
                        keyReactivationRecords,
                        keyPassword: authentication.getPassword(),
                        onReactivation: cb,
                    });
                    return call();
                }}
            />
        );
    };
    const handleReactivateKey = (ID: string) => {
        const Key = getKeyByID(User.Keys, ID);
        if (!Key) {
            throw new Error('Missing key');
        }
        return handleReactivateKeys([
            {
                user: User,
                keys: userKeys,
                keysToReactivate: [Key],
            },
        ]);
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
                onReactivateKey={handleReactivateKey}
            />
        </SettingsSectionWide>
    );
};

export default UserKeysSections;
