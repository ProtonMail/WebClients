import React, { useState, useEffect, CSSProperties, useRef } from 'react';
import { classnames, useToggle, useWindowSize, useNotifications, useMailSettings } from 'react-components';
import { c } from 'ttag';
import { Address } from 'proton-shared/lib/interfaces';
import { noop } from 'proton-shared/lib/helpers/function';
import { setBit, clearBit } from 'proton-shared/lib/helpers/bitset';

import { MapSendInfo } from '../../models/crypto';
import { MessageExtended, Message, MessageExtendedWithData, PartialMessageExtended } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';
import {
    COMPOSER_GUTTER,
    COMPOSER_VERTICAL_GUTTER,
    APP_BAR_WIDTH,
    HEADER_HEIGHT,
    COMPOSER_HEIGHT,
    COMPOSER_SWITCH_MODE
} from '../../containers/ComposerContainer';
import { getRecipients, mergeMessages } from '../../helpers/message/messages';
import { EditorActionsRef } from './editor/Editor';
import { setContent } from '../../helpers/message/messageContent';
import ComposerPasswordModal from './ComposerPasswordModal';
import ComposerExpirationModal from './ComposerExpirationModal';
import { useHandler } from '../../hooks/useHandler';
import { useMessage } from '../../hooks/useMessage';
import { useInitializeMessage } from '../../hooks/useMessageReadActions';
import { useCreateDraft, useSaveDraft, useDeleteDraft } from '../../hooks/useMessageWriteActions';
import { useSendMessage } from '../../hooks/useSendMessage';
import { isNewDraft } from '../../helpers/message/messageDraft';
import { useAttachments } from '../../hooks/useAttachments';
import { getDate } from '../../helpers/elements';

enum ComposerInnerModal {
    None,
    Password,
    Expiration
}

export interface MessageChange {
    (message: PartialMessageExtended | ((message: MessageExtended) => PartialMessageExtended)): void;
}

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
            height: 35
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
    messageID: string;
    addresses: Address[];
    onFocus: () => void;
    onClose: () => void;
}

const Composer = ({ style: inputStyle = {}, focus, messageID, addresses, onFocus, onClose: inputOnClose }: Props) => {
    const [mailSettings] = useMailSettings();
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

    // Indicates that the composer is sending the message
    // Some behavior has to change, example, stop auto saving
    const [sending, setSending] = useState(false);

    // Indicates that the composer is saving the message
    // Not background auto-save, only user manually using the save button
    const [manualSaving, setManualSaving] = useState(false);

    // Indicates that the composer is open but the edited message is not yet ready
    // Needed to prevent edition while data is not ready
    const [editorReady, setEditorReady] = useState(false);

    // Flag representing the presence of an inner modal on the composer
    const [innerModal, setInnerModal] = useState(ComposerInnerModal.None);

    // Model value of the edited message in the composer
    const [modelMessage, setModelMessage] = useState<MessageExtended>({
        localID: messageID
    });

    // Map of send preferences and send icons for each recipient
    const [mapSendInfo, setMapSendInfo] = useState<MapSendInfo>({});

    // Synced with server version of the edited message
    const { message: syncedMessage, addAction } = useMessage(messageID);

    // All message actions
    const initialize = useInitializeMessage(syncedMessage.localID);
    const createDraft = useCreateDraft();
    const saveDraft = useSaveDraft();
    const sendMessage = useSendMessage();
    const deleteDraft = useDeleteDraft(syncedMessage);

    // Computed composer status
    const syncInProgress = syncedMessage.actionStatus !== undefined;
    const syncStatus = syncedMessage.actionStatus || '';
    const actionBarLocked = !editorReady || manualSaving || sending || closing;

    // Manage focus from the container yet keeping logic in each component
    const addressesBlurRef = useRef<() => void>(noop);
    const addressesFocusRef = useRef<() => void>(noop);
    const contentFocusRef = useRef<() => void>(noop);

    // Get a ref on the editor to trigger insertion of embedded images
    const editorActionsRef: EditorActionsRef = useRef();

    // onClose handler can be called in a async handler
    // Input onClose ref can change in the meantime
    const onClose = useHandler(inputOnClose);

    useEffect(() => {
        if (
            !syncInProgress &&
            (syncedMessage.data?.ID || (!syncedMessage.data?.ID && !isNewDraft(syncedMessage.localID))) &&
            syncedMessage.initialized === undefined
        ) {
            addAction(initialize);
        }

        if (modelMessage.document === undefined || modelMessage.data?.ID !== syncedMessage.data?.ID) {
            setModelMessage({
                ...syncedMessage,
                ...modelMessage,
                data: { ...syncedMessage.data, ...modelMessage.data } as Message,
                document: syncedMessage.document
            });
        }
    }, [syncInProgress, syncedMessage.document, syncedMessage.data?.ID]);

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

    const actualSave = (message: MessageExtended) => {
        if (message.data?.ID) {
            return addAction(() => saveDraft(message as MessageExtendedWithData));
        }
        return addAction(() => createDraft(message as MessageExtendedWithData));
    };

    const autoSave = useHandler(actualSave, { debounce: 2000 });

    // Initial save action intended to create the draft on the server
    useEffect(() => {
        autoSave(syncedMessage);
    }, []);

    const handleChange: MessageChange = (message) => {
        if (message instanceof Function) {
            setModelMessage((modelMessage) => {
                const newModelMessage = mergeMessages(modelMessage, message(modelMessage));
                autoSave(newModelMessage);
                return newModelMessage;
            });
        } else {
            const newModelMessage = mergeMessages(modelMessage, message);
            setModelMessage(newModelMessage);
            autoSave(newModelMessage);
        }
    };

    const handleChangeContent = (content: string) => {
        setContent(modelMessage, content);
        const newModelMessage = { ...modelMessage };
        setModelMessage(newModelMessage);
        autoSave(newModelMessage);
    };

    const handleChangeFlag = (changes: Map<number, boolean>) => {
        let Flags = modelMessage.data?.Flags || 0;
        changes.forEach((isAdd, flag) => {
            const action = isAdd ? setBit : clearBit;
            Flags = action(Flags, flag);
        });
        handleChange({ data: { Flags } });
    };

    const {
        pendingFiles,
        pendingUploads,
        handleAddAttachmentsStart,
        handleAddEmbeddedImages,
        handleAddAttachmentsUpload,
        handleCancelAddAttachment,
        handleRemoveAttachment,
        handleRemoveUpload
    } = useAttachments(modelMessage, handleChange, editorActionsRef);

    const handlePassword = () => {
        setInnerModal(ComposerInnerModal.Password);
    };
    const handleExpiration = () => {
        setInnerModal(ComposerInnerModal.Expiration);
    };
    const handleCloseInnerModal = () => {
        setInnerModal(ComposerInnerModal.None);
    };

    const handleManualSave = async (messageToSave = modelMessage) => {
        setManualSaving(true);
        autoSave.abort?.();
        try {
            await actualSave(messageToSave);
            createNotification({ text: c('Info').t`Message saved` });
        } finally {
            setManualSaving(false);
        }
    };
    const handleSend = async () => {
        setSending(true);
        autoSave.abort?.();
        try {
            await addAction(() =>
                sendMessage(modelMessage as MessageExtended & Required<Pick<MessageExtended, 'data'>>)
            );
            createNotification({ text: c('Success').t`Message sent` });
            onClose();
        } catch {
            setSending(false);
        }
    };
    const handleDelete = async () => {
        setClosing(true);
        autoSave.abort?.();
        try {
            await addAction(deleteDraft);
            createNotification({ text: c('Info').t`Message discarded` });
        } finally {
            onClose();
        }
    };

    const handleClick = async () => {
        if (minimized) {
            toggleMinimized();
        }
        onFocus();
    };
    const handleClose = async () => {
        setClosing(true);
        try {
            await handleManualSave();
        } finally {
            onClose();
        }
    };
    const handleContentFocus = () => {
        addressesBlurRef.current();
        onFocus(); // Events on the main div will not fire because/ the editor is in an iframe
    };

    const style = computeStyle(inputStyle, minimized, maximized, width, height);

    return (
        <div
            className={classnames([
                'composer flex flex-column',
                !focus && 'composer--is-blur',
                minimized && 'composer--is-minimized'
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
            <div className="composer-container flex flex-column flex-item-fluid relative w100 p0-5">
                {innerModal === ComposerInnerModal.Password && (
                    <ComposerPasswordModal
                        message={modelMessage.data}
                        onClose={handleCloseInnerModal}
                        onChange={handleChange}
                    />
                )}
                {innerModal === ComposerInnerModal.Expiration && (
                    <ComposerExpirationModal
                        message={modelMessage}
                        onClose={handleCloseInnerModal}
                        onChange={handleChange}
                    />
                )}
                <div
                    className={classnames([
                        'composer-blur-container flex-column flex-item-fluid mw100',
                        // Only hide the editor not to unload it each time a modal is on top
                        innerModal === ComposerInnerModal.None ? 'flex' : 'hidden'
                    ])}
                >
                    <ComposerMeta
                        message={modelMessage}
                        addresses={addresses}
                        mailSettings={mailSettings}
                        mapSendInfo={mapSendInfo}
                        setMapSendInfo={setMapSendInfo}
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
                        onChangeFlag={handleChangeFlag}
                        onFocus={handleContentFocus}
                        onAddAttachments={handleAddAttachmentsStart}
                        onAddEmbeddedImages={handleAddEmbeddedImages}
                        onCancelAddAttachment={handleCancelAddAttachment}
                        onRemoveAttachment={handleRemoveAttachment}
                        onRemoveUpload={handleRemoveUpload}
                        pendingFiles={pendingFiles}
                        pendingUploads={pendingUploads}
                        onSelectEmbedded={handleAddAttachmentsUpload}
                        contentFocusRef={contentFocusRef}
                        editorActionsRef={editorActionsRef}
                    />
                    <ComposerActions
                        message={modelMessage}
                        date={getDate(syncedMessage.data)}
                        lock={actionBarLocked}
                        sending={sending}
                        closing={closing}
                        syncInProgress={syncInProgress}
                        syncStatus={syncStatus}
                        onAddAttachments={handleAddAttachmentsStart}
                        onExpiration={handleExpiration}
                        onPassword={handlePassword}
                        onSave={handleManualSave}
                        onSend={handleSend}
                        onDelete={handleDelete}
                        addressesBlurRef={addressesBlurRef}
                    />
                </div>
            </div>
        </div>
    );
};

export default Composer;
