import React, { useState, useEffect, CSSProperties, useRef, useCallback } from 'react';
import { classnames, useToggle, useWindowSize, useNotifications, useApi } from 'react-components';
import { c } from 'ttag';
import { Address } from 'proton-shared/lib/interfaces';
import { noop, debounce } from 'proton-shared/lib/helpers/function';

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
    const { state: minimized, toggle: toggleMinimized } = useToggle(false);
    const { state: maximized, toggle: toggleMaximized } = useToggle(false);
    const [opening, setOpening] = useState(true); // Needed to force focus only at first time
    const [closing, setClosing] = useState(false); // Needed to keep component alive while saving/deleting on close
    const [modelMessage, setModelMessage] = useState<MessageExtended>(inputMessage);
    const [pendingFiles, setPendingFiles] = useState<File[]>();
    const [
        syncedMessage,
        { initialize, createDraft, saveDraft, send, deleteDraft, udateAttachments },
        { lock: syncLock, current: syncActivity }
    ] = useMessage(inputMessage.data, mailSettings);
    const [width, height] = useWindowSize();
    const { createNotification } = useNotifications();

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
        if (!opening) {
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
    }, [syncedMessage]);

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
        if (!modelMessage.document) {
            return;
        }
        modelMessage.document.innerHTML = content;
        setModelMessage({ ...modelMessage });
        autoSave(modelMessage);
    };
    const save = async (messageToSave = modelMessage) => {
        await saveDraft(messageToSave);
        createNotification({ text: c('Info').t`Message saved` });
    };

    const handleAddAttachmentsEnd = async (action: ATTACHMENT_ACTION, files = pendingFiles) => {
        setPendingFiles(undefined);

        const uploads = await upload(files, syncedMessage, action, api);

        if (uploads.length) {
            const updatedMessage = await udateAttachments(uploads, action);
            const Attachments = getAttachments(updatedMessage.data);
            const newModelMessage = mergeMessages(modelMessage, { data: { Attachments } });
            setModelMessage(newModelMessage);

            if (action == ATTACHMENT_ACTION.INLINE) {
                contentInsertRef.current?.(
                    createEmbeddedMap(
                        uploads.map((upload) => {
                            const cid = readCID(upload.attachment);
                            return [cid, updatedMessage.embeddeds?.get(cid)];
                        })
                    )
                );
            }
        }
    };
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
                        onChange={handleChange}
                        addressesBlurRef={addressesBlurRef}
                        addressesFocusRef={addressesFocusRef}
                    />
                    <ComposerContent
                        message={modelMessage}
                        onChange={handleChangeContent}
                        onFocus={addressesBlurRef.current}
                        onAddAttachments={handleAddAttachmentsStart}
                        onRemoveAttachment={handleRemoveAttachment}
                        pendingFiles={pendingFiles}
                        onCancelEmbedded={() => setPendingFiles(undefined)}
                        onSelectEmbedded={handleAddAttachmentsEnd}
                        contentFocusRef={contentFocusRef}
                        contentInsertRef={contentInsertRef}
                    />
                    <ComposerActions
                        message={modelMessage}
                        lock={syncLock}
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
