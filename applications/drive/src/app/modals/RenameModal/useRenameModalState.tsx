import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useNotifications } from '@proton/components';
import type { NodeEntity } from '@proton/drive';
import { generateNodeUid, useDrive } from '@proton/drive';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useDriveEventManager } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';

export type UseRenameModalProps = ModalStateProps & {
    onClose?: () => void;
    onSubmit: (newName: string) => Promise<void>;
    volumeId: string;
    linkId: string;
    name: string;
    // Delete isFile & isDoc once the OLD RenameModal is removed
    isFile: boolean;
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
    ...modalProps
}: UseRenameModalProps) => {
    const { drive } = useDrive();
    const events = useDriveEventManager();
    const { createNotification } = useNotifications();
    const [node, setNode] = useState<null | NodeEntity>(null);
    const isFile = node?.type === 'file';
    const ignoreExtension = getIgnoreExtension(node, name);
    const { handleError } = useSdkErrorHandler();
    useEffect(() => {
        const fetchNode = async () => {
            const tmpNode = await drive.getNode(generateNodeUid(volumeId, linkId));
            if (tmpNode?.ok) {
                setNode(tmpNode.value);
            } else {
                // TODO: handle the DegradedNode case, we might still have the data we need to rename
                createNotification({ type: 'error', text: c('Notification').jt`Cannot load file or folder info` });
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
            .then(() => {
                createNotification({ text: successNotificationText, preWrap: true });
            })
            .catch((e) => {
                handleError(e, unhandledErrorNotificationText, { nodeUid });
            });
        await events.pollEvents.volumes(volumeId);
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
