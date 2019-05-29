import React from 'react';
import { c } from 'ttag';
import { Button, Block, Loader, SubTitle, useUser, useModals, useUserKeys } from 'react-components';

import { convertKey, getPrimaryKey } from './helper';
import { ACTIONS } from './KeysActions';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import KeysTable from './KeysTable';

const UserKeysSections = () => {
    const { createModal } = useModals();
    const [User] = useUser();
    const [userKeysList, loadingUserKeys] = useUserKeys(User);

    const title = <SubTitle>{c('Title').t`Contact encryption keys`}</SubTitle>;

    if (loadingUserKeys && !Array.isArray(userKeysList)) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

    const { Name: userName } = User;

    const handleAction = async (action, keyIndex) => {
        const targetKey = userKeysList[keyIndex];
        const { privateKey } = targetKey;

        if (action === ACTIONS.REACTIVATE) {
            const userKeysToReactivate = [
                {
                    User,
                    inactiveKeys: [targetKey],
                    keys: userKeysList
                }
            ];
            return createModal(<ReactivateKeysModal allKeys={userKeysToReactivate} />);
        }
        if (action === ACTIONS.EXPORT_PUBLIC_KEY) {
            return createModal(<ExportPublicKeyModal name={userName} privateKey={privateKey} />);
        }
        if (action === ACTIONS.EXPORT_PRIVATE_KEY) {
            return createModal(<ExportPrivateKeyModal name={userName} privateKey={privateKey} />);
        }
    };

    const keysFormatted = userKeysList.map(convertKey);
    const { privateKey: primaryPrivateKey } = getPrimaryKey(userKeysList) || {};
    const canExportPrivateKey = primaryPrivateKey && primaryPrivateKey.isDecrypted();

    return (
        <>
            {title}
            {canExportPrivateKey && (
                <Block>
                    <Button
                        onClick={() => {
                            createModal(<ExportPrivateKeyModal name={userName} privateKey={primaryPrivateKey} />);
                        }}
                    >
                        {c('Action').t`Export private key`}
                    </Button>
                </Block>
            )}
            <KeysTable keys={keysFormatted} onAction={handleAction} />
        </>
    );
};

export default UserKeysSections;
