import React, { useState, useEffect, CSSProperties, useRef, useCallback } from 'react';
import { classnames, useToggle, useWindowSize, useNotifications, useApi } from 'react-components';
import { c } from 'ttag';
import { Address } from 'proton-shared/lib/interfaces';
import { noop, debounce } from 'proton-shared/lib/helpers/function';
import { wait } from 'proton-shared/lib/helpers/promise';

import { MessageExtended } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';
import { useMessage } from '../../hooks/useMessage';
import {
    COMPOSER_GUTTER,
    COMPOSER_VERTICAL_GUTTER,
    APP_BAR_WIDTH,
    HEADER_HEIGHT,
    COMPOSER_HEIGHT,
    COMPOSER_SWITCH_MODE
} from '../../containers/ComposerContainer';
import { getRecipients, getAttachments } from '../../helpers/message/messages';
import { upload, ATTACHMENT_ACTION } from '../../helpers/attachment/attachmentUploader';
import { Attachment } from '../../models/attachment';
import { removeAttachment } from '../../api/attachments';
import { createEmbeddedMap, readCID, isEmbeddable } from '../../helpers/embedded/embeddeds';
import { InsertRef } from './editor/Editor';
import { setContent } from '../../helpers/message/messageContent';

/**
 * Create a new MessageExtended with props from both m1 and m2
 * Almost a standard deep merge but simplified with specific needs
 * m2 props will override those from m1
 */
const mergeMessages = (m1: MessageExtended, m2: MessageExtended): MessageExtended => ({
    ...m1,
    ...m2,
    data: { ...m1.data, ...m2.data }
});

const computeStyle = (
    inputStyle: CSSProperties,
    minimized: boolean,
    maximized: boolean,
    width: number,
    height: number
): CSSProperties => {
    if (minimized) {
        return {
            ...inputStyle,
            height: 'auto'
        };
    }
    if (maximized) {
        return {
            ...inputStyle,
            right: COMPOSER_GUTTER,
            width: width - COMPOSER_GUTTER - APP_BAR_WIDTH,
            height: height - COMPOSER_VERTICAL_GUTTER * 2
        };
    }
    return inputStyle;
};

interface Props {
    style?: CSSProperties;
    focus: boolean;
    message?: MessageExtended;
    mailSettings: any;
    addresses: Address[];
    onFocus: () => void;
    onChange: (message: MessageExtended) => void;
    onClose: () => void;
}

const Composer = ({
    style: inputStyle = {},
    focus,
    message: inputMessage = {},
    mailSettings,
    addresses,
    onFocus,
    onChange,
    onClose
}: Props) => {
    const api = useApi();
    const [width, height] = useWindowSize();
    const { createNotification } = useNotifications();

    // Minimized status of the composer
    const { state: minimized, toggle: toggleMinimized } = useToggle(false);

    // Maximized status of the composer
    const { state: maximized, toggle: toggleMaximized } = useToggle(false);

    // Indicates that the composer is in its initial opening
    // Needed to be able to force focus only at first time
    const [opening, setOpening] = useState(true);

    // Indicates that the composer is being closed
    // Needed to keep component alive while saving/deleting on close
    const [closing, setClosing] = useState(false);

    // Indicates that the composer is open but the edited message is not yet ready
    // Needed to prevent edition while data is not ready
    const [editorReady, setEditorReady] = useState(false);

    // Model value of the edited message in the composer
    const [modelMessage, setModelMessage] = useState<MessageExtended>(inputMessage);

    // Pending upload files
    const [pendingFiles, setPendingFiles] = useState<File[]>();

    // Synced with server version of the edited message
    const [
        syncedMessage,
        { initialize, createDraft, saveDraft, send, deleteDraft, updateAttachments },
        { lock: syncLock, current: syncActivity }
    ] = useMessage(inputMessage.data, mailSettings);

    // Manage focus from the container yet keeping logic in each component
    const addressesBlurRef = useRef<() => void>(noop);
    const addressesFocusRef = useRef<() => void>(noop);
    const contentFocusRef = useRef<() => void>(noop);

    // Get a ref on the editor to trigger insertion of embedded images
    const contentInsertRef: InsertRef = useRef();

    useEffect(() => {
        if (!syncLock && !syncedMessage.data?.ID) {
            createDraft(inputMessage);
        }

        if (!syncLock && syncedMessage.data?.ID && typeof syncedMessage.initialized === 'undefined') {
            initialize();
        }

        if (modelMessage.document === undefined) {
            setModelMessage({ ...modelMessage, data: syncedMessage.data, document: syncedMessage.document });
        }

        onChange(syncedMessage);
    }, [syncLock, syncedMessage]);

    useEffect(() => {
        if (!maximized && height - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT < COMPOSER_HEIGHT - COMPOSER_SWITCH_MODE) {
            toggleMaximized();
        }
        if (maximized && height - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT > COMPOSER_HEIGHT + COMPOSER_SWITCH_MODE) {
            toggleMaximized();
        }
    }, [height]);

    // Manage focus at opening
    useEffect(() => {
        if (!opening || !editorReady) {
            return;
        }
        setTimeout(() => {
            if (getRecipients(syncedMessage.data).length === 0) {
                addressesFocusRef.current();
            } else {
                contentFocusRef.current();
            }
        });
        setOpening(false);
    }, [editorReady]);

    const autoSave = useCallback(
        debounce(async (message: MessageExtended) => {
            await saveDraft(message);
        }, 2000),
        [saveDraft]
    );
    const handleChange = (message: MessageExtended) => {
        const newModelMessage = mergeMessages(modelMessage, message);
        setModelMessage(newModelMessage);
        autoSave(newModelMessage);
    };
    const handleChangeContent = (content: string) => {
        setContent(modelMessage, content);
        const newModelMessage = { ...modelMessage };
        setModelMessage(newModelMessage);
        autoSave(newModelMessage);
    };
    const save = async (messageToSave = modelMessage) => {
        await saveDraft(messageToSave);
        createNotification({ text: c('Info').t`Message saved` });
    };

    const handleAddAttachmentsEnd = async (action: ATTACHMENT_ACTION, files = pendingFiles) => {
        setPendingFiles(undefined);
        const uploads = await upload(files, syncedMessage, action, api);

        if (uploads.length) {
            const updatedMessage = await updateAttachments(uploads, action);
            const Attachments = getAttachments(updatedMessage.data);
            const newModelMessage = mergeMessages(modelMessage, { data: { Attachments } });
            setModelMessage(newModelMessage);

            if (action == ATTACHMENT_ACTION.INLINE) {
                // Needed to wait for the setModelMessage to be applied before inserting the image in the editor
                // Insertion will trigger a change and update the model which has to be updated
                await wait(0);

                const newEmbeddeds = createEmbeddedMap(
                    uploads.map((upload) => {
                        const cid = readCID(upload.attachment);
                        return [cid, updatedMessage.embeddeds?.get(cid)];
                    })
                );

                contentInsertRef.current?.(newEmbeddeds);
            }
        }
    };
    const handleAddEmbeddedImages = async (files: File[]) => handleAddAttachmentsEnd(ATTACHMENT_ACTION.INLINE, files);
    const handleAddAttachmentsStart = async (files: File[]) => {
        const embeddable = files.every((file) => isEmbeddable(file.type));

        if (embeddable) {
            setPendingFiles(files);
        } else {
            handleAddAttachmentsEnd(ATTACHMENT_ACTION.ATTACHMENT, files);
        }
    };

    const handleRemoveAttachment = (attachment: Attachment) => async () => {
        await api(removeAttachment(attachment.ID || '', modelMessage.data?.ID || ''));
        const Attachments = modelMessage.data?.Attachments?.filter((a: Attachment) => a.ID !== attachment.ID);
        const newModelMessage = mergeMessages(modelMessage, { data: { Attachments } });
        setModelMessage(newModelMessage);
        save(modelMessage);
    };
    const handleSave = async () => {
        await save();
    };
    const handleSend = async () => {
        await send(modelMessage);
        createNotification({ text: c('Success').t`Message sent` });
        onClose();
    };
    const handleDelete = async () => {
        setClosing(true);
        await deleteDraft();
        createNotification({ text: c('Info').t`Message discarded` });
        onClose();
    };
    const handleClick = async () => {
        if (minimized) {
            toggleMinimized();
        }
        onFocus();
    };
    const handleClose = async () => {
        setClosing(true);
        await save();
        onClose();
    };

    if (closing) {
        return null;
    }

    const style = computeStyle(inputStyle, minimized, maximized, width, height);

    return (
        <div
            className={classnames([
                'composer flex flex-column p0-5',
                !focus && 'composer-blur',
                minimized && 'composer-minimized pb0'
            ])}
            style={style}
            onFocus={onFocus}
            onClick={handleClick}
        >
            <ComposerTitleBar
                message={modelMessage}
                minimized={minimized}
                maximized={maximized}
                toggleMinimized={toggleMinimized}
                toggleMaximized={toggleMaximized}
                onClose={handleClose}
            />
            {!minimized && (
                <>
                    <ComposerMeta
                        message={modelMessage}
                        addresses={addresses}
                        disabled={!editorReady}
                        onChange={handleChange}
                        addressesBlurRef={addressesBlurRef}
                        addressesFocusRef={addressesFocusRef}
                    />
                    <ComposerContent
                        message={modelMessage}
                        disabled={!editorReady}
                        onEditorReady={() => setEditorReady(true)}
                        onChange={handleChange}
                        onChangeContent={handleChangeContent}
                        onFocus={addressesBlurRef.current}
                        onAddAttachments={handleAddAttachmentsStart}
                        onAddEmbeddedImages={handleAddEmbeddedImages}
                        onRemoveAttachment={handleRemoveAttachment}
                        pendingFiles={pendingFiles}
                        onCancelEmbedded={() => setPendingFiles(undefined)}
                        onSelectEmbedded={handleAddAttachmentsEnd}
                        contentFocusRef={contentFocusRef}
                        contentInsertRef={contentInsertRef}
                    />
                    <ComposerActions
                        message={modelMessage}
                        lock={syncLock || !editorReady}
                        activity={syncActivity}
                        onAddAttachments={handleAddAttachmentsStart}
                        onSave={handleSave}
                        onSend={handleSend}
                        onDelete={handleDelete}
                    />
                </>
            )}
        </div>
    );
};

export default Composer;
