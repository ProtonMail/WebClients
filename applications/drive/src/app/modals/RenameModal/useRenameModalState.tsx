import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useNotifications } from '@proton/components';
import { type NodeEntity, NodeType, splitNodeUid, useDrive } from '@proton/drive';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useDriveEventManager } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import type { RenameModalViewProps } from './RenameModalView';

export type RenameModalInnerProps = {
    nodeUid: string;
    onSuccess?: (newName: string) => Promise<void>;
};

export type UseRenameModalProps = ModalStateProps &
    RenameModalInnerProps & {
        onClose?: () => void;
    };

const splitLinkName = (linkName: string) => {
    if (linkName.endsWith('.')) {
        return [linkName, ''];
    }
    return splitExtension(linkName);
};

const computeFilenameToFocus = (name: string, nodeType: NodeType, mediaType: string | undefined) => {
    if (nodeType === NodeType.Folder || nodeType === NodeType.Album) {
        return name;
    }

    if (mediaType && (isProtonDocsDocument(mediaType) || isProtonDocsSpreadsheet(mediaType))) {
        return name;
    }
    const [namePart] = splitLinkName(name);
    if (namePart) {
        return namePart;
    }

    return name;
};

export const useRenameModalState = ({
    nodeUid,
    onClose,
    onSuccess,
    ...modalProps
}: UseRenameModalProps): RenameModalViewProps => {
    const { drive } = useDrive();
    const events = useDriveEventManager();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
    const [node, setNode] = useState<null | NodeEntity>(null);
    // The initial name for the rename modal. this can be different from the node name
    // in case of node errors (e.g. decryption errors).
    const [initialName, setInitialName] = useState<null | string>(null);

    useEffect(() => {
        const fetchNode = async () => {
            try {
                const maybeNode = await drive.getNode(nodeUid);
                const nodeEntity = getNodeEntity(maybeNode);

                const hasNameDecryptionError =
                    maybeNode.ok === false &&
                    maybeNode.error.name.ok === false &&
                    maybeNode.error.name.error instanceof Error;

                let initialName = nodeEntity.node.name;
                setNode(nodeEntity.node);
                if (hasNameDecryptionError) {
                    initialName = '';

                    // NOTE: We only care about name decryption errors. In the case of an InvalidNameError,
                    // we keep the node name instead of resetting it. This allows the user to nudge
                    // it to fix the issue (for example, by removing a forbidden character).
                    // A decryption error, on the other hand, is less recoverable and requires
                    // clearing the name.
                }
                setInitialName(initialName);
            } catch (e) {
                handleError(e, { showNotification: true });
                modalProps.onExit();
            }
        };

        void fetchNode();
    }, [nodeUid, createNotification, drive]);

    if (!node || initialName === null) {
        return {
            loaded: false,
        };
    }

    const handleSubmit = async (newName: string) => {
        const nodeUid = node.uid;
        const volumeId = splitNodeUid(nodeUid).volumeId;
        const successNotificationText = c('Notification').t`"${newName}" renamed successfully`;
        const unhandledErrorNotificationText = c('Notification').t`"${newName}" failed to be renamed`;
        await drive
            .renameNode(nodeUid, newName)
            .then(async () => {
                await events.pollEvents.volumes(volumeId); // TODO:EVENTS
                createNotification({ text: successNotificationText, preWrap: true });
                await onSuccess?.(newName);
                onClose();
            })
            .catch((e) => {
                handleError(e, { fallbackMessage: unhandledErrorNotificationText, extra: { nodeUid } });
            });
    };

    return {
        ...modalProps,
        loaded: true,
        handleSubmit,
        onClose,
        name: initialName,
        nameToFocus: computeFilenameToFocus(initialName, node.type, node.mediaType),
        nodeType: node.type,
    };
};
