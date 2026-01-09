import { c } from 'ttag';

import { type ModalStateProps, useNotifications } from '@proton/components';
import { generateNodeUid, useDrive } from '@proton/drive';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useDriveEventManager } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';

export type RenameModalInnerProps = {
    onSuccess?: (newName: string) => Promise<void>;
    volumeId: string;
    linkId: string;
    name: string;
    mediaType: string | undefined;
    isFile: boolean; // isFile could come from getNode but it will be slow with noticeable delay in the modal
    /** @deprecated used only on legacy, it will not be handled here */
    onSubmit?: (newName: string) => Promise<void>;
    // Delete below props once the OLD RenameModal is removed
    isDoc?: boolean;
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

const computeFilenameToFocus = (name: string, isFile: boolean, mediaType: string | undefined) => {
    if (!isFile || !mediaType) {
        return name;
    }

    if (isProtonDocsDocument(mediaType) || isProtonDocsSpreadsheet(mediaType)) {
        return name;
    }
    const [namePart] = splitLinkName(name);
    if (namePart) {
        return namePart;
    }

    return name;
};

export const useRenameModalState = ({
    onClose,
    volumeId,
    linkId,
    name,
    isFile,
    mediaType,
    onSuccess,
    ...modalProps
}: UseRenameModalProps) => {
    const { drive } = useDrive();
    const events = useDriveEventManager();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const handleSubmit = async (newName: string) => {
        const nodeUid = generateNodeUid(volumeId, linkId);
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
        handleSubmit,
        onClose,
        name,
        nameToFocus: computeFilenameToFocus(name, isFile, mediaType),
        isFile,
    };
};
