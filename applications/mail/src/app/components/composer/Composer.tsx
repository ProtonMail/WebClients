import React, { useState, useEffect, CSSProperties, useRef, useCallback } from 'react';
import { classnames, useToggle, useWindowSize, useNotifications, useApi } from 'react-components';
import { c } from 'ttag';

import { MessageExtended } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';
import { useMessage } from '../../hooks/useMessage';
import { Address } from '../../models/address';
import {
    COMPOSER_GUTTER,
    COMPOSER_VERTICAL_GUTTER,
    APP_BAR_WIDTH,
    HEADER_HEIGHT,
    COMPOSER_HEIGHT,
    COMPOSER_SWITCH_MODE
} from '../../containers/ComposerContainer';
import { noop, debounce } from 'proton-shared/lib/helpers/function';
import { getRecipients } from '../../helpers/message/messages';
import { upload, ATTACHMENT_ACTION } from '../../helpers/attachment/attachmentUploader';
import { Attachment } from '../../models/attachment';
import { removeAttachment } from '../../api/attachments';

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
    const [modelMessage, setModelMessage] = useState<MessageExtended>(inputMessage);
    const [
        syncedMessage,
        { initialize, createDraft, saveDraft, send, deleteDraft },
        { lock: syncLock, current: syncActivity }
    ] = useMessage(inputMessage.data, mailSettings);
    const [width, height] = useWindowSize();
    const { createNotification } = useNotifications();

    // Manage focus from the container yet keeping logic in each component
    const addressesBlurRef = useRef<() => void>(noop);
    const addressesFocusRef = useRef<() => void>(noop);
    const contentFocusRef = useRef<() => void>(noop);

    useEffect(() => {
        if (!syncLock && !syncedMessage.data?.ID) {
            createDraft(inputMessage);
        }

        if (!syncLock && syncedMessage.data?.ID && typeof syncedMessage.initialized === 'undefined') {
            initialize();
        }

        if (modelMessage.content === undefined) {
            setModelMessage({ ...modelMessage, content: syncedMessage.content });
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
        console.log('change', message);
        const newModelMessage = mergeMessages(modelMessage, message);
        setModelMessage(newModelMessage);
        autoSave(newModelMessage);
    };
    const save = async (messageToSave = modelMessage) => {
        await saveDraft(messageToSave);
        createNotification({ text: c('Info').t`Message saved` });
    };
    const handleAddAttachments = async (files: File[]) => {
        const attachments = await upload(files, modelMessage, ATTACHMENT_ACTION.ATTACHMENT, api);
        if (attachments) {
            const Attachments = [...(modelMessage.data?.Attachments || []), ...attachments];
            const newModelMessage = mergeMessages(modelMessage, { data: { Attachments } });
            setModelMessage(newModelMessage);
            save(modelMessage);
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
        onClose();
        await deleteDraft();
        createNotification({ text: c('Info').t`Message discarded` });
    };
    const handleClick = async () => {
        if (minimized) {
            toggleMinimized();
        }
        onFocus();
    };
    const handleClose = async () => {
        onClose();
        await save();
    };

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
                        onChange={handleChange}
                        onFocus={addressesBlurRef.current}
                        onRemoveAttachment={handleRemoveAttachment}
                        contentFocusRef={contentFocusRef}
                    />
                    <ComposerActions
                        message={modelMessage}
                        lock={syncLock}
                        activity={syncActivity}
                        onAddAttachments={handleAddAttachments}
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
