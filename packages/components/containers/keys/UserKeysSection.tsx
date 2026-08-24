import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms/Button/Button';

import Loader from '../../components/loader/Loader';
import useModalState from '../../components/modalTwo/useModalState';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSectionWide from '../account/SettingsSectionWide';
import KeysTable from './KeysTable';
import AddKeyModal from './addKey/AddKeyModal';
import { DeleteInactiveUserKeyModal } from './deleteKey/DeleteInactiveUserKeyModal';
import ExportPrivateKeyModal from './exportKey/ExportPrivateKeyModal';
import { getKeyByID } from './shared/helper';
import { useKeysMetadata } from './shared/useKeysMetadata';

const UserKeysSections = () => {
    const [User] = useUser();
    const [userKeys, loadingUserKeys] = useUserKeys();

    const {
        user: { displayKeys: userKeysDisplay, existingAlgorithms },
    } = useKeysMetadata({
        user: User,
        userKeys,
    });

    const [addKeyProps, setAddKeyModalOpen, renderAddKey] = useModalState();
    const [exportKeyProps, setExportKeyOpen, renderExportKey] = useModalState();
    const [deleteKeyProps, setDeleteKeyOpen, renderDeleteKey] = useModalState();
    const [tmpId, setTmpId] = useState('');

    const userKey = userKeys && tmpId ? getKeyByID(userKeys, tmpId) : null;
    const tmpUserKey = getKeyByID(User?.Keys || [], tmpId);

    const { Name: userName } = User;

    const canGenerateUserKey = User.isSelf && User.isPrivate && userKeysDisplay.length < 20;

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
                    <SettingsParagraph>{c('Info').t`No account keys exist`}</SettingsParagraph>
                </SettingsSectionWide>
            );
        }

        return (
            <SettingsSectionWide>
                {canGenerateUserKey && (
                    <div className="mb-4">
                        <Button
                            shape="outline"
                            onClick={() => {
                                setAddKeyModalOpen(true);
                            }}
                            data-testid="generateUserKey"
                        >
                            {c('Action').t`Generate key`}
                        </Button>
                    </div>
                )}
                <KeysTable
                    keys={userKeysDisplay}
                    onExportPrivateKey={(ID) => {
                        setExportKeyOpen(true);
                        setTmpId(ID);
                    }}
                    onDeleteKey={(ID) => {
                        setDeleteKeyOpen(true);
                        setTmpId(ID);
                    }}
                />
            </SettingsSectionWide>
        );
    })();

    return (
        <>
            {renderAddKey && userKeys && (
                <AddKeyModal target={{ type: 'user' }} existingAlgorithms={existingAlgorithms} {...addKeyProps} />
            )}
            {renderExportKey && !!userKey?.privateKey && (
                <ExportPrivateKeyModal
                    name={userName}
                    privateKey={userKey.privateKey}
                    {...exportKeyProps}
                    onExit={() => {
                        setTmpId('');
                        exportKeyProps.onExit();
                    }}
                />
            )}
            {renderDeleteKey && tmpUserKey && (
                <DeleteInactiveUserKeyModal
                    userKey={tmpUserKey}
                    {...deleteKeyProps}
                    onExit={() => {
                        setTmpId('');
                        deleteKeyProps.onExit();
                    }}
                />
            )}
            {children}
        </>
    );
};

export default UserKeysSections;
