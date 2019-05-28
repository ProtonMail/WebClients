import React from 'react';
import { c } from 'ttag';
import { Block, Loader, SubTitle, useUser, useModals, useUserKeys } from 'react-components';

import { convertKey, getPrimaryKey } from './helper';
import { ACTIONS } from './KeysActions';
import ReactivateKeysModal from './reactivateKeys/ReactivateKeysModal';
import ExportPublicKeyModal from './exportKey/ExportPublicKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import KeysHeaderActions, { ACTIONS as HEADER_ACTIONS } from './KeysHeaderActions';
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

    const keysFormatted = userKeysList.map(convertKey);
    const { privateKey: primaryPrivateKey } = getPrimaryKey(userKeysList) || {};

    const { Name: userName } = User;

    const keysPermissions = {
        [HEADER_ACTIONS.EXPORT_PRIVATE_KEY]: primaryPrivateKey && primaryPrivateKey.isDecrypted()
    };

    const handleKeysAction = (action) => {
        if (action === HEADER_ACTIONS.EXPORT_PRIVATE_KEY) {
            return createModal(<ExportPrivateKeyModal name={userName} privateKey={primaryPrivateKey} />);
        }
    };

    const handleAction = async (action, keyID, keyIndex) => {
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

    return (
        <>
            {title}
            <Block>
                <KeysHeaderActions permissions={keysPermissions} onAction={handleKeysAction} />
            </Block>
            <KeysTable keys={keysFormatted} onAction={handleAction} />
        </>
    );
};

export default UserKeysSections;
