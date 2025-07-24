import type { ChangeEvent, FocusEvent } from 'react';
import type React from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useFormErrors, useNotifications } from '@proton/components';
import { splitNodeUid, useDrive } from '@proton/drive';

import { formatLinkName, useDriveEventManager, validateLinkNameField } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';

export type UseCreateFolderModalStateProps = ModalStateProps & {
    parentFolderUid?: string;
    onCreateDone?: (folderUid: string) => void;

    // Here only for retro compatibility, should be removed once the SDK migration is done
    folder?: { shareId: string; linkId: string };
    createFolder?: (abortSignal: AbortSignal, shareId: string, parentLinkId: string, name: string) => Promise<string>;
};

export const useCreateFolderModalState = ({
    parentFolderUid,
    onCreateDone,
    onClose,
    // Here only for retro compatibility, should be removed once the SDK migration is done
    createFolder,
    folder,
    ...modalProps
}: UseCreateFolderModalStateProps) => {
    const [folderName, setFolderName] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const { drive } = useDrive();
    const events = useDriveEventManager();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const inputFieldError = validator([validateLinkNameField(folderName) || '']);

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        const name = formatLinkName(folderName);
        setFolderName(name);

        if (!parentFolderUid) {
            return;
        }

        try {
            const newFolder = await drive.createFolder(parentFolderUid, name);
            const { volumeId } = splitNodeUid(parentFolderUid);
            const { node } = getNodeEntity(newFolder!);
            await events.pollEvents.volumes(volumeId);
            createNotification({
                type: 'success',
                text: c('Notification').jt`"${name}" created successfully`,
            });
            onCreateDone?.(node.uid);
            onClose();
        } catch (error) {
            handleError(error, { fallbackMessage: c('Error').t`Failed to create folder`, extra: { parentFolderUid } });
        }
    };

    return {
        folderName,
        handleSubmit,
        handleChange,
        handleBlur,
        inputFieldError,
        onClose,
        ...modalProps,
    };
};
