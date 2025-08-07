import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useNotifications } from '@proton/components';
import type { NodeEntity } from '@proton/drive';
import { generateNodeUid, useDrive } from '@proton/drive';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useDriveEventManager } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';

export type UseRenameModalProps = ModalStateProps & {
    onClose?: () => void;
    volumeId: string;
    linkId: string;
    name: string;
    isFile: boolean; // isFile could come from getNode but it will be slow with noticeable delay in the modal
    // Delete below props once the OLD RenameModal is removed
    onSubmit: (newName: string) => Promise<void>;
    isDoc: boolean;
};

const splitLinkName = (linkName: string) => {
    if (linkName.endsWith('.')) {
        return [linkName, ''];
    }
    return splitExtension(linkName);
};

export const getIgnoreExtension = (node: null | NodeEntity, name: string) => {
    const isFile = node?.type === 'file';
    let ignoreExtension = !isFile;
    if (node !== null && node.mediaType) {
        const [namePart] = splitLinkName(name);
        ignoreExtension = isProtonDocsDocument(node.mediaType) || isProtonDocsSpreadsheet(node.mediaType) || !namePart;
    }
    return ignoreExtension;
};

export const useRenameModalState = ({
    onClose,
    onSubmit,
    volumeId,
    linkId,
    name,
    isFile,
    ...modalProps
}: UseRenameModalProps) => {
    const { drive } = useDrive();
    const events = useDriveEventManager();
    const { createNotification } = useNotifications();
    const [node, setNode] = useState<null | NodeEntity>(null);
    const ignoreExtension = getIgnoreExtension(node, name);
    const { handleError } = useSdkErrorHandler();
    useEffect(() => {
        const fetchNode = async () => {
            try {
                const maybeNode = await drive.getNode(generateNodeUid(volumeId, linkId));
                const { node } = getNodeEntity(maybeNode);
                setNode(node);
            } catch (e) {
                handleError(e);
                onClose();
            }
        };
        void fetchNode();
    }, [volumeId, linkId, createNotification, drive]);

    const handleSubmit = async (newName: string) => {
        const nodeUid = generateNodeUid(volumeId, linkId);
        const successNotificationText = c('Notification').t`"${newName}" renamed successfully`;
        const unhandledErrorNotificationText = c('Notification').t`"${newName}" failed to be renamed`;

        await drive
            .renameNode(nodeUid, newName)
            .then(async () => {
                createNotification({ text: successNotificationText, preWrap: true });
                await events.pollEvents.volumes(volumeId);
                onClose();
            })
            .catch((e) => {
                handleError(e, { fallbackMessage: unhandledErrorNotificationText, extra: { nodeUid } });
            });
    };

    return {
        ...modalProps,
        handleSubmit,
        onClose,
        name,
        ignoreExtension,
        isFile,
    };
};
