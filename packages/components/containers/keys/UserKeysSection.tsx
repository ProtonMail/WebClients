import React from 'react';
import { c } from 'ttag';
import { getPrimaryKey, reactivateKeysProcess } from 'proton-shared/lib/keys';

import { Alert, Button, Block, Loader } from '../../components';
import {
    useUser,
    useModals,
    useUserKeys,
    useEventManager,
    useAuthentication,
    useApi,
    useGetAddresses,
} from '../../hooks';

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
        return <Loader />;
    }

    // E.g. vpn user
    if (!userKeys.length) {
        return <Alert>{c('Info').t`No contact encryption keys exist`}</Alert>;
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
        <>
            {canExportPrimaryPrivateKey && (
                <Block>
                    <Button
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
                </Block>
            )}
            <KeysTable
                keys={userKeysDisplay}
                onExportPrivateKey={handleExportPrivate}
                onExportPublicKey={handleExportPublic}
                onReactivateKey={handleReactivateKey}
            />
        </>
    );
};

export default UserKeysSections;
