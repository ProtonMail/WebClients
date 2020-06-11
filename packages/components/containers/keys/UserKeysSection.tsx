import React from 'react';
import { c } from 'ttag';
import {
    Alert,
    Button,
    Block,
    Loader,
    useUser,
    useModals,
    useUserKeys,
    useEventManager,
    useAuthentication,
    useApi
} from '../../index';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';
import getCachedKeyByID from 'proton-shared/lib/keys/getCachedKeyByID';

import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import KeysTable from './KeysTable';
import useDisplayKeys from './shared/useDisplayKeys';
import { KeyReactivation, OnProcessArguments as ReactivateProcessArguments } from './reactivateKeys/interface';
import reactivateKeysProcess from './reactivateKeys/reactivateKeysProcess';

const UserKeysSections = () => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const authentication = useAuthentication();
    const [User] = useUser();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const userKeysDisplay = useDisplayKeys({ keys: userKeysList, User });

    if (loadingUserKeys && !Array.isArray(userKeysList)) {
        return <Loader />;
    }

    // E.g. vpn user
    if (!userKeysList.length) {
        return <Alert>{c('Info').t`No contact encryption keys exist`}</Alert>;
    }

    const { Name: userName } = User;

    const handleExportPrivate = (ID: string) => {
        const userKey = getCachedKeyByID(userKeysList, ID);
        if (!userKey || !userKey.privateKey) {
            return;
        }
        return createModal(<ExportPrivateKeyModal name={userName} privateKey={userKey.privateKey} />);
    };

    const handleExportPublic = (ID: string) => {
        const userKey = getCachedKeyByID(userKeysList, ID);
        if (!userKey) {
            return;
        }
        return createModal(
            <ExportPublicKeyModal name={userName} PrivateKey={userKey.Key.PrivateKey} publicKey={userKey.publicKey} />
        );
    };

    const handleReactivateKeys = (initialKeysToReactivate: KeyReactivation[]) => {
        const onProcess = async ({
            keysToReactivate,
            setKeysToReactivate,
            isUploadMode,
            oldPassword
        }: ReactivateProcessArguments) => {
            await reactivateKeysProcess({
                api,
                keysToReactivate,
                setKeysToReactivate,
                isUploadMode,
                newPassword: authentication.getPassword(),
                oldPassword,
                userKeysList
            });
            await call();
        };
        return createModal(<ReactivateKeysModal onProcess={onProcess} allKeys={initialKeysToReactivate} />);
    };

    const handleReactivateKey = (ID: string) => {
        const userKey = getCachedKeyByID(userKeysList, ID);
        if (!userKey) {
            return;
        }
        return handleReactivateKeys([
            {
                User,
                keys: [userKey]
            }
        ]);
    };

    const primaryPrivateKey = getPrimaryKey(userKeysList);
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
