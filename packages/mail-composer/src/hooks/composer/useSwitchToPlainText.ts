import type { MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useHandler } from '@proton/hooks/useHandler';
import { getEmbeddedImages, updateImages } from '@proton/mail-message/helpers/message/messageImages';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { removeAttachment } from '@proton/shared/lib/api/attachments';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import type { MessageChange } from '../../components/composer/Composer';
import type { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';
import { getEmbeddedAttachments, getSwitchToPlainTextChange } from '../../helpers/composer/mimeTypeSwitch';
import type { PromiseHandlers } from '../usePromise';
import { usePromise } from '../usePromise';

interface Props {
    modelMessage: MessageState;
    getModelMessage: () => MessageState;
    syncedMessageID: string | undefined;
    pendingSave: PromiseHandlers<void>;
    editorRef: MutableRefObject<ExternalEditorActions | undefined>;
    onChange: MessageChange;
    setBlockquoteExpanded: (expanded: boolean) => void;
}

/**
 * Switching to plain text drops the embedded images, so a saved draft has to delete them on the server too,
 * or they would be sent from there. The switch only happens once all of them are deleted.
 */
export const useSwitchToPlainText = ({
    modelMessage,
    getModelMessage,
    syncedMessageID,
    pendingSave,
    editorRef,
    onChange,
    setBlockquoteExpanded,
}: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const pendingSwitch = usePromise<void>();
    const [isRequested, setIsRequested] = useState(false);
    const getEditorContentRef = useRef<() => string>(() => '');

    // The draft creation copies the server attachments into the model, which would bring the embedded images back
    const isDraftSynced = !pendingSave.isPending && modelMessage.data?.ID === syncedMessageID;

    const removeDeletedAttachments = (deletedAttachments: Attachment[]) => {
        const deletedIDs = deletedAttachments.map(({ ID }) => ID);
        const embeddedImages = getEmbeddedImages(getModelMessage());

        embeddedImages
            .filter((image) => deletedIDs.includes(image.attachment.ID))
            .forEach((image) => editorRef.current?.removeEmbedded(image.attachment));

        onChange((message: MessageState) => ({
            data: { Attachments: message.data?.Attachments?.filter(({ ID }) => !deletedIDs.includes(ID)) || [] },
            messageImages: updateImages(
                message.messageImages,
                undefined,
                undefined,
                getEmbeddedImages(message).filter((image) => !deletedIDs.includes(image.attachment.ID))
            ),
        }));
    };

    const switchToPlainText = async () => {
        const message = getModelMessage();
        const messageID = message.data?.ID;
        const savedAttachments = messageID ? getEmbeddedAttachments(message).filter(({ ID }) => ID) : [];

        const results = await Promise.allSettled(
            savedAttachments.map((attachment) => api(removeAttachment(attachment.ID as string, messageID as string)))
        );

        if (results.some(({ status }) => status === 'rejected')) {
            removeDeletedAttachments(savedAttachments.filter((_, index) => results[index].status === 'fulfilled'));
            createNotification({
                type: 'error',
                text: c('Error').t`Embedded images could not be removed. The message was not switched to plain text.`,
            });
            return;
        }

        onChange(getSwitchToPlainTextChange(getModelMessage(), getEditorContentRef.current()));
        setBlockquoteExpanded(true);
    };

    useEffect(() => {
        if (isRequested && isDraftSynced) {
            setIsRequested(false);
            void switchToPlainText().finally(() => pendingSwitch.resolver());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- switch once both the request and the draft are ready
    }, [isRequested, isDraftSynced]);

    // Nothing must keep waiting for a switch that a closed composer will never run
    useEffect(() => () => pendingSwitch.resolver(), []);

    const handleSwitchToPlainText = useHandler((getEditorContent: () => string) => {
        if (pendingSwitch.isPending) {
            return;
        }
        getEditorContentRef.current = getEditorContent;
        pendingSwitch.renew();
        setIsRequested(true);
    });

    return { handleSwitchToPlainText, pendingSwitch };
};
