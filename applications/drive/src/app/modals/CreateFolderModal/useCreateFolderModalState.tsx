import type React from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useFormErrors, useNotifications } from '@proton/components';
import { type ProtonDriveClient, getDrive, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { getEllipsedName } from '@proton/drive/modules/intl';
import { validateNodeName } from '@proton/drive/modules/validation';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';

type Drive = Pick<ProtonDriveClient, 'createFolder' | 'getNode'>;

export type CreateFolderModalInnerProps = {
    drive?: Drive;
    parentFolderUid?: string;
    onSuccess?: ({
        uid,
        nodeId,
        name,
        parentUid,
    }: {
        uid?: string;
        parentUid?: string;
        nodeId: string;
        name: string;
    }) => void;
};

export type UseCreateFolderModalStateProps = ModalStateProps & CreateFolderModalInnerProps;

export const useCreateFolderModalState = ({
    drive = getDrive(),
    parentFolderUid,
    onSuccess,
    onClose,
    ...modalProps
}: UseCreateFolderModalStateProps) => {
    const [folderName, setFolderName] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();

    const inputFieldError = validator([validateNodeName(folderName) || '']);

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatNodeName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        const name = formatNodeName(folderName);
        setFolderName(name);

        if (!parentFolderUid) {
            return;
        }

        try {
            const newFolder = await drive.createFolder(parentFolderUid, name);
            // Needs to pass nodeId because the same callback is called by the legacy app component
            // in public pages we don't have the ability to get the uid from the shareId

            const { node } = getNodeEntity(newFolder);
            const { nodeId } = splitNodeUid(node.uid);
            await getBusDriver().emit(
                {
                    type: BusDriverEventName.CREATED_NODES,
                    items: [{ uid: node.uid, parentUid: node.parentUid, isShared: node.isShared, isTrashed: false }],
                },
                drive
            );
            onSuccess?.({ uid: node.uid, parentUid: node.parentUid, nodeId, name });
            const ellipsedName = getEllipsedName(name);
            createNotification({
                type: 'success',
                text: c('Notification').jt`"${ellipsedName}" created successfully`,
            });

            onClose();
        } catch (error) {
            handleSdkError(error, {
                fallbackMessage: c('Error').t`Failed to create folder`,
                extra: { parentFolderUid },
            });
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

function formatNodeName(name: string) {
    return name.trim();
}
