import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import type { DriveBrowserHandle } from '../../../components/Files/DriveBrowser/DriveBrowser';
import { useDriveSDK } from '../../../hooks/useDriveSDK';

interface CreateFolderModalProps {
    open: boolean;
    folderId: string;
    driveBrowserRef: React.RefObject<DriveBrowserHandle>;
    onClose: () => void;
}

export const CreateFolderModal = ({ open, folderId, driveBrowserRef, onClose }: CreateFolderModalProps) => {
    const { createNotification } = useNotifications();
    const { createFolder } = useDriveSDK();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();

    const handleClose = () => {
        setFolderName('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedFolderName = folderName.trim();
        if (!trimmedFolderName) return;

        try {
            await createFolder(folderId, trimmedFolderName);
            createNotification({
                text: c('collider_2025:Success').t`Folder "${trimmedFolderName}" created successfully`,
                type: 'success',
            });
            setFolderName('');
            onClose();
            driveBrowserRef.current?.triggerRefresh();
        } catch (error) {
            console.error('Failed to create folder:', error);
            createNotification({
                text: error instanceof Error ? error.message : c('collider_2025:Error').t`Failed to create folder`,
                type: 'error',
            });
        }
    };

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={handleClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            size="large"
            open={open}
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={c('Title').t`Create a new folder`} />
            <ModalTwoContent>
                <InputFieldTwo
                    id="folder-name"
                    autoFocus
                    value={folderName}
                    label={c('Label').t`Folder name`}
                    placeholder={c('Placeholder').t`Enter a new folder name`}
                    onChange={(e) => setFolderName(e.target.value)}
                    required
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" loading={loading} disabled={!folderName.trim()}>
                    {c('Action').t`Create`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
