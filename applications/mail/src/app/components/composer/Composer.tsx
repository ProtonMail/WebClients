import React, { useState, useEffect, useRef } from 'react';
import {
    classnames,
    useToggle,
    useNotifications,
    useMailSettings,
    useGetEncryptionPreferences,
    useHandler
} from 'react-components';
import { c } from 'ttag';
import { Address, MailSettings } from 'proton-shared/lib/interfaces';
import { noop } from 'proton-shared/lib/helpers/function';
import { setBit, clearBit } from 'proton-shared/lib/helpers/bitset';
import { COMPOSER_MODE } from 'proton-shared/lib/constants';

import { MessageExtended, Message, MessageExtendedWithData, PartialMessageExtended } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';
import { getRecipients, mergeMessages } from '../../helpers/message/messages';
import { setContent } from '../../helpers/message/messageContent';
import ComposerPasswordModal from './ComposerPasswordModal';
import ComposerExpirationModal from './ComposerExpirationModal';
import { useMessage } from '../../hooks/useMessage';
import { useInitializeMessage } from '../../hooks/useMessageReadActions';
import { useSaveDraft, useDeleteDraft } from '../../hooks/useMessageWriteActions';
import { useSendMessage, useSendVerifications, useSendWithUndo } from '../../hooks/useSendMessage';
import { isNewDraft } from '../../helpers/message/messageDraft';
import { useAttachments } from '../../hooks/useAttachments';
import { getDate } from '../../helpers/elements';
import { computeComposerStyle, shouldBeMaximized } from '../../helpers/composerPositioning';
import { WindowSize, Breakpoints } from '../../models/utils';
import { EditorActionsRef } from './editor/SquireEditorWrapper';
import { useHasScroll } from '../../hooks/useHasScroll';
import { reloadSendInfo, useMessageSendInfo } from '../../hooks/useSendInfo';
import { useDebouncedHandler } from '../../hooks/useDebouncedHandler';
import { OnCompose } from '../../hooks/useCompose';
import { useDragOver } from '../../hooks/useDragOver';
import { DRAG_ADDRESS_KEY } from '../../constants';
import { usePromiseFromState } from '../../hooks/usePromiseFromState';

enum ComposerInnerModal {
    None,
    Password,
    Expiration
}

export type MessageUpdate = PartialMessageExtended | ((message: MessageExtended) => PartialMessageExtended);

export interface MessageChange {
    (update: MessageUpdate, reloadSendInfo?: boolean): void;
}

export interface MessageChangeFlag {
    (changes: Map<number, boolean>, reloadSendInfo?: boolean): void;
}

interface Props {
    index: number;
    count: number;
    focus: boolean;
    messageID: string;
    addresses: Address[];
    windowSize: WindowSize;
    breakpoints: Breakpoints;
    onFocus: () => void;
    onClose: () => void;
    onCompose: OnCompose;
}

const Composer = ({
    index,
    count,
    focus,
    messageID,
    addresses,
    windowSize,
    breakpoints,
    onFocus,
    onClose: inputOnClose
}: Props) => {
    const [mailSettings] = useMailSettings() as [MailSettings, boolean, Error];
    const { createNotification } = useNotifications();

    const bodyRef = useRef<HTMLDivElement>(null);
    const [hasVertialScroll] = useHasScroll(bodyRef);

    // Minimized status of the composer
    const { state: minimized, toggle: toggleMinimized } = useToggle(false);

    // Maximized status of the composer
    const { state: maximized, toggle: toggleMaximized } = useToggle(
        mailSettings.ComposerMode === COMPOSER_MODE.MAXIMIZED
    );

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
    const messageSendInfo = useMessageSendInfo(modelMessage);
    const getEncryptionPreferences = useGetEncryptionPreferences();

    // Synced with server version of the edited message
    const { message: syncedMessage, addAction } = useMessage(messageID);

    // All message actions
    const initialize = useInitializeMessage(syncedMessage.localID);
    const saveDraft = useSaveDraft();
    const sendVerifications = useSendVerifications();
    const sendMessage = useSendMessage();
    const sendWithUndo = useSendWithUndo();
    const deleteDraft = useDeleteDraft(syncedMessage);

    // Computed composer status
    const syncInProgress = !!syncedMessage.actionInProgress;
    const contentLocked = opening || sending || closing;
    const actionBarLocked = opening || manualSaving || sending || closing;

    // Manage focus from the container yet keeping logic in each component
    const addressesBlurRef = useRef<() => void>(noop);
    const addressesFocusRef = useRef<() => void>(noop);
    const contentFocusRef = useRef<() => void>(noop);

    // Get a ref on the editor to trigger insertion of embedded images
    const editorActionsRef: EditorActionsRef = useRef();

    // onClose handler can be called in a async handler
    // Input onClose ref can change in the meantime
    const onClose = useHandler(inputOnClose);

    const [, dragHandlers] = useDragOver((event) => event.dataTransfer.types.includes(DRAG_ADDRESS_KEY), 'move', {
        onDragEnter: onFocus
    });

    // Manage existing draft initialization
    useEffect(() => {
        if (
            !syncInProgress &&
            (syncedMessage.data?.ID || (!syncedMessage.data?.ID && !isNewDraft(syncedMessage.localID))) &&
            syncedMessage.initialized === undefined
        ) {
            addAction(initialize);
        }
    }, [syncInProgress, syncedMessage.document, syncedMessage.data?.ID, syncedMessage.initialized]);

    // Manage populating the model from the server
    useEffect(() => {
        if (
            (modelMessage.document === undefined && modelMessage.plainText === undefined) ||
            modelMessage.data?.ID !== syncedMessage.data?.ID
        ) {
            const newModelMessage = {
                ...syncedMessage,
                ...modelMessage,
                data: {
                    ...syncedMessage.data,
                    // Forget previously setted password if kept in the cache
                    Password: undefined,
                    PasswordHint: undefined,
                    ...modelMessage.data,
                    // Attachments are updated by the draft creation request
                    Attachments: syncedMessage.data?.Attachments
                } as Message,
                document: syncedMessage.document,
                embeddeds: syncedMessage.embeddeds
            };
            setModelMessage(newModelMessage);
            reloadSendInfo(messageSendInfo, newModelMessage, getEncryptionPreferences);
        }
    }, [syncInProgress, syncedMessage.document, syncedMessage.data?.ID]);

    // Manage opening
    useEffect(() => {
        const attachmentToCreate = !syncedMessage.data?.ID && !!syncedMessage.data?.Attachments?.length;

        if (!syncInProgress && attachmentToCreate) {
            addAction(() => saveDraft(syncedMessage as MessageExtendedWithData));
        }

        if (editorReady && !syncInProgress && !attachmentToCreate) {
            setOpening(false);
        }
    }, [editorReady, syncInProgress, syncedMessage.data]);

    // Automatic maximize if height too small
    useEffect(() => {
        const shouldMaximized = shouldBeMaximized(windowSize.height);

        if (!maximized && shouldMaximized) {
            toggleMaximized();
        }
    }, [windowSize.height]);

    // Manage focus at opening
    useEffect(() => {
        let timeout: number | undefined;

        if (!opening) {
            timeout = setTimeout(() => {
                if (getRecipients(syncedMessage.data).length === 0) {
                    addressesFocusRef.current();
                } else {
                    contentFocusRef.current();
                }
            });
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [opening]);

    const actualSave = (message: MessageExtended) => {
        return addAction(() => saveDraft(message as MessageExtendedWithData));
    };

    const [pendingSave, autoSave] = useDebouncedHandler(actualSave, 2000);

    const handleChange: MessageChange = (update, shouldReloadSendInfo) => {
        setModelMessage((modelMessage) => {
            const messageChanges = update instanceof Function ? update(modelMessage) : update;
            const newModelMessage = mergeMessages(modelMessage, messageChanges);
            if (shouldReloadSendInfo) {
                reloadSendInfo(messageSendInfo, newModelMessage, getEncryptionPreferences);
            }
            autoSave(newModelMessage);
            return newModelMessage;
        });
    };

    const handleChangeContent = (content: string, refreshEditor = false) => {
        setModelMessage((modelMessage) => {
            setContent(modelMessage, content);
            const newModelMessage = { ...modelMessage };
            autoSave(newModelMessage);
            return newModelMessage;
        });
        if (refreshEditor) {
            editorActionsRef.current?.setContent(content);
        }
    };

    const handleChangeFlag = (changes: Map<number, boolean>, shouldReloadSendInfo = false) => {
        handleChange((message) => {
            let Flags = message.data?.Flags || 0;
            changes.forEach((isAdd, flag) => {
                const action = isAdd ? setBit : clearBit;
                Flags = action(Flags, flag);
            });
            return { data: { Flags } };
        }, shouldReloadSendInfo);
    };

    /**
     * Ensure the draft is saved before continue
     */
    const handleSaveNow = async () => {
        if (!modelMessage.data?.ID) {
            autoSave.abort?.();
            return actualSave(modelMessage);
        }
    };

    const {
        pendingFiles,
        pendingUploads,
        uploadInProgress,
        handleAddAttachmentsStart,
        handleAddEmbeddedImages,
        handleAddAttachmentsUpload,
        handleCancelAddAttachment,
        handleRemoveAttachment,
        handleRemoveUpload
    } = useAttachments(modelMessage, handleChange, handleSaveNow, editorActionsRef);

    const promiseUploadInProgress = usePromiseFromState(!uploadInProgress);

    const handlePassword = () => {
        setInnerModal(ComposerInnerModal.Password);
    };
    const handleExpiration = () => {
        setInnerModal(ComposerInnerModal.Expiration);
    };
    const handleCloseInnerModal = () => {
        setInnerModal(ComposerInnerModal.None);
    };

    const handleManualSave = async () => {
        setManualSaving(true);
        autoSave.abort?.();
        try {
            await actualSave(modelMessage);
            createNotification({ text: c('Info').t`Message saved` });
        } finally {
            setManualSaving(false);
        }
    };

    const handleSendAfterUploads = useHandler(async () => {
        let verificationResults;
        try {
            verificationResults = await sendVerifications(modelMessage as MessageExtendedWithData);
        } catch {
            setSending(false);
            return;
        }

        const { cleanMessage, mapSendPrefs, hasChanged } = verificationResults;
        const alreadySaved = !!cleanMessage.data.ID && !pendingSave && !hasChanged;
        autoSave.abort?.();
        await sendWithUndo(() =>
            addAction(async () => {
                try {
                    await sendMessage(cleanMessage, mapSendPrefs, alreadySaved);
                } catch (error) {
                    createNotification({
                        text: c('Error').t`Error while sending the message. Message is not sent`,
                        type: 'error'
                    });
                    console.error('Error while sending the message.', error);
                    setSending(false);
                    throw error;
                }
            })
        );
        onClose();
    });

    const handleSend = useHandler(async () => {
        setSending(true);
        await promiseUploadInProgress.current;
        await handleSendAfterUploads();
    });

    const handleDelete = async () => {
        setClosing(true);
        autoSave.abort?.();
        try {
            if (syncedMessage.data?.ID) {
                await addAction(deleteDraft);
            }
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
            if (pendingSave) {
                await handleManualSave();
            }
        } finally {
            onClose();
        }
    };
    const handleContentFocus = () => {
        addressesBlurRef.current();
        onFocus(); // Events on the main div will not fire because/ the editor is in an iframe
    };

    const style = computeComposerStyle(index, count, focus, minimized, maximized, breakpoints.isNarrow, windowSize);

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
            {...dragHandlers}
        >
            <ComposerTitleBar
                message={modelMessage}
                closing={closing}
                minimized={minimized}
                maximized={maximized}
                toggleMinimized={toggleMinimized}
                toggleMaximized={toggleMaximized}
                onClose={handleClose}
            />
            <div className="composer-container flex flex-column flex-item-fluid relative w100">
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
                        'composer-blur-container flex flex-column flex-item-fluid mw100',
                        // Only hide the editor not to unload it each time a modal is on top
                        innerModal === ComposerInnerModal.None ? 'flex' : 'hidden'
                    ])}
                >
                    <div
                        ref={bodyRef}
                        className="composer-body-container flex flex-column flex-nowrap flex-item-fluid mw100 scroll-if-needed mt0-5"
                    >
                        <ComposerMeta
                            message={modelMessage}
                            addresses={addresses}
                            mailSettings={mailSettings}
                            messageSendInfo={messageSendInfo}
                            disabled={!editorReady}
                            onChange={handleChange}
                            onChangeContent={handleChangeContent}
                            addressesBlurRef={addressesBlurRef}
                            addressesFocusRef={addressesFocusRef}
                        />
                        <ComposerContent
                            message={modelMessage}
                            messageSendInfo={messageSendInfo}
                            disabled={contentLocked}
                            breakpoints={breakpoints}
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
                    </div>
                    <ComposerActions
                        className={hasVertialScroll ? 'composer-actions--has-scroll' : undefined}
                        message={modelMessage}
                        date={getDate(syncedMessage.data, '')}
                        lock={actionBarLocked}
                        opening={opening}
                        sending={sending}
                        syncInProgress={syncInProgress}
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
