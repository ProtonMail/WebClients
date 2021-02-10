import React, { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { c } from 'ttag';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getRecipients } from 'proton-shared/lib/mail/messages';
import { classnames, useToggle, useNotifications, useMailSettings, useHandler } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { setBit, clearBit } from 'proton-shared/lib/helpers/bitset';
import { COMPOSER_MODE } from 'proton-shared/lib/constants';
import { wait } from 'proton-shared/lib/helpers/promise';
import { MessageExtended, MessageExtendedWithData, PartialMessageExtended } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';
import { mergeMessages } from '../../helpers/message/messages';
import { getContent, setContent } from '../../helpers/message/messageContent';
import ComposerPasswordModal from './ComposerPasswordModal';
import ComposerExpirationModal from './ComposerExpirationModal';
import { useMessage } from '../../hooks/message/useMessage';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useSaveDraft, useDeleteDraft } from '../../hooks/message/useSaveDraft';
import { useSendMessage, useSendVerifications } from '../../hooks/composer/useSendMessage';
import { isNewDraft } from '../../helpers/message/messageDraft';
import { useAttachments } from '../../hooks/composer/useAttachments';
import { getDate } from '../../helpers/elements';
import { computeComposerStyle, shouldBeMaximized } from '../../helpers/composerPositioning';
import { WindowSize, Breakpoints } from '../../models/utils';
import { EditorActionsRef } from './editor/SquireEditorWrapper';
import { useHasScroll } from '../../hooks/useHasScroll';
import { useReloadSendInfo, useMessageSendInfo } from '../../hooks/useSendInfo';
import { useDebouncedHandler } from '../../hooks/useDebouncedHandler';
import { DRAG_ADDRESS_KEY } from '../../constants';
import { usePromiseFromState } from '../../hooks/usePromiseFromState';
import { OnCompose } from '../../hooks/composer/useCompose';
import { useComposerHotkeys } from '../../hooks/composer/useComposerHotkeys';
import SendingMessageNotification, {
    createSendingMessageNotificationManager,
} from '../notifications/SendingMessageNotification';
import SavingDraftNotification from '../notifications/SavingDraftNotification';
import { useMessageCache } from '../../containers/MessageProvider';

enum ComposerInnerModal {
    None,
    Password,
    Expiration,
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
    windowSize,
    breakpoints,
    onFocus,
    onClose: inputOnClose,
    onCompose,
}: Props) => {
    const messageCache = useMessageCache();
    const [mailSettings] = useMailSettings();
    const { createNotification, hideNotification } = useNotifications();

    const bodyRef = useRef<HTMLDivElement>(null);
    const [hasVerticalScroll] = useHasScroll(bodyRef);

    // Minimized status of the composer
    const { state: minimized, toggle: toggleMinimized } = useToggle(false);

    // Maximized status of the composer
    const { state: maximized, toggle: toggleMaximized } = useToggle(
        mailSettings?.ComposerMode === COMPOSER_MODE.MAXIMIZED
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

    // Indicates that the composer is open but the edited message is not yet ready
    // Needed to prevent edition while data is not ready
    const [editorReady, setEditorReady] = useState(false);

    // Flag representing the presence of an inner modal on the composer
    const [innerModal, setInnerModal] = useState(ComposerInnerModal.None);

    // Model value of the edited message in the composer
    const [modelMessage, setModelMessage] = useState<MessageExtended>({
        localID: messageID,
    });

    // Map of send preferences and send icons for each recipient
    const messageSendInfo = useMessageSendInfo(modelMessage);
    const reloadSendInfo = useReloadSendInfo();

    // Synced with server version of the edited message
    const { message: syncedMessage, addAction } = useMessage(messageID);

    // All message actions
    const initialize = useInitializeMessage(syncedMessage.localID);
    const saveDraft = useSaveDraft();
    const sendVerifications = useSendVerifications();
    const sendMessage = useSendMessage();
    const deleteDraft = useDeleteDraft();

    // Computed composer status
    const syncInProgress = !!syncedMessage.actionInProgress;
    const hasRecipients = getRecipients(syncedMessage.data).length > 0;
    const lock = opening || sending || closing;

    // Manage focus from the container yet keeping logic in each component
    const addressesBlurRef = useRef<() => void>(noop);
    const addressesFocusRef = useRef<() => void>(noop);
    const contentFocusRef = useRef<() => void>(noop);

    // Get a ref on the editor to trigger insertion of embedded images
    const editorActionsRef: EditorActionsRef = useRef();

    // onClose handler can be called in a async handler
    // Input onClose ref can change in the meantime
    const onClose = useHandler(inputOnClose);

    const handleDragEnter = (event: DragEvent) => {
        if (event.dataTransfer?.types.includes(DRAG_ADDRESS_KEY)) {
            onFocus();
        }
    };

    // Manage existing draft initialization
    useEffect(() => {
        if (
            !syncInProgress &&
            (syncedMessage.data?.ID || (!syncedMessage.data?.ID && !isNewDraft(syncedMessage.localID))) &&
            syncedMessage.initialized === undefined
        ) {
            void addAction(initialize);
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
                    Attachments: syncedMessage.data?.Attachments,
                } as Message,
                document: syncedMessage.document,
                embeddeds: syncedMessage.embeddeds,
            };
            setModelMessage(newModelMessage);
            void reloadSendInfo(messageSendInfo, newModelMessage);
        } else {
            let change = false;
            const Attachments = modelMessage.data?.Attachments?.map((attachment) => {
                const match = syncedMessage?.data?.Attachments.find(
                    (syncedAttachment) => attachment.ID === syncedAttachment.ID
                );
                if (match && attachment.KeyPackets !== match.KeyPackets) {
                    change = true;
                    return { ...attachment, KeyPackets: match.KeyPackets };
                }
                return attachment;
            });
            if (change) {
                setModelMessage({ ...modelMessage, data: { ...modelMessage.data, Attachments } as Message });
            }
        }
    }, [syncInProgress, syncedMessage.document, syncedMessage.data?.ID]);

    // Manage opening
    useEffect(() => {
        const attachmentToCreate = !syncedMessage.data?.ID && !!syncedMessage.data?.Attachments?.length;

        if (!syncInProgress && attachmentToCreate) {
            void addAction(() => saveDraft(syncedMessage as MessageExtendedWithData));
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

    const {
        pending: pendingSave,
        pause: pauseAutoSave,
        restart: restartAutoSave,
        handler: autoSave,
    } = useDebouncedHandler(actualSave, 2000);

    const handleChange: MessageChange = useHandler((update, shouldReloadSendInfo) => {
        setModelMessage((modelMessage) => {
            const messageChanges = update instanceof Function ? update(modelMessage) : update;
            const newModelMessage = mergeMessages(modelMessage, messageChanges);
            if (shouldReloadSendInfo) {
                void reloadSendInfo(messageSendInfo, newModelMessage);
            }
            void autoSave(newModelMessage);
            return newModelMessage;
        });
    });

    const handleChangeContent = useHandler(
        (content: string, refreshEditor: boolean = false, silent: boolean = false) => {
            setModelMessage((modelMessage) => {
                setContent(modelMessage, content);
                const newModelMessage = { ...modelMessage };
                if (!silent) {
                    void autoSave(newModelMessage);
                }
                if (refreshEditor) {
                    editorActionsRef.current?.setContent(newModelMessage);
                }
                return newModelMessage;
            });
        }
    );

    const handleChangeFlag = useHandler((changes: Map<number, boolean>, shouldReloadSendInfo: boolean = false) => {
        handleChange((message) => {
            let Flags = message.data?.Flags || 0;
            changes.forEach((isAdd, flag) => {
                const action = isAdd ? setBit : clearBit;
                Flags = action(Flags, flag);
            });
            return { data: { Flags } };
        }, shouldReloadSendInfo);
    });

    /**
     * In some rare situations, Squire can miss an input event.
     * A missed event can lead to not sending the expected content which is serious.
     * This function perform an ultimate content check before sending especially.
     */
    const ensureMessageContent = () => {
        // Should not be possible, more to satisfy TS
        if (!editorActionsRef.current) {
            return true;
        }

        const actualContent = editorActionsRef.current.getContent();
        const modelContent = getContent(modelMessage);

        if (actualContent.trim() !== modelContent.trim()) {
            handleChangeContent(actualContent);
        }
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
        handleAddAttachmentsUpload,
        handleCancelAddAttachment,
        handleRemoveAttachment,
        handleRemoveUpload,
    } = useAttachments(modelMessage, handleChange, handleSaveNow, editorActionsRef);

    useEffect(() => {
        if (uploadInProgress) {
            pauseAutoSave();
        } else {
            restartAutoSave();
        }
    }, [uploadInProgress]);

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

    const handleDiscard = async () => {
        const messageFromCache = messageCache.get(modelMessage.localID) as MessageExtended;
        if (messageFromCache.data?.ID) {
            await addAction(() => deleteDraft(messageFromCache));
        }
        createNotification({ text: c('Info').t`Draft discarded` });
    };

    const handleDelete = async () => {
        setClosing(true);
        autoSave.abort?.();
        try {
            await handleDiscard();
        } finally {
            onClose();
        }
    };

    const handleManualSaveAfterUploads = useHandler(async () => {
        let notificationID: number | undefined;
        autoSave.abort?.();
        try {
            const promise = actualSave(modelMessage);
            notificationID = createNotification({
                text: (
                    <SavingDraftNotification
                        promise={promise}
                        onDiscard={() => {
                            if (notificationID) {
                                hideNotification(notificationID);
                            }
                            void handleDiscard();
                        }}
                    />
                ),
                expiration: -1,
                disableAutoClose: true,
            });
            await promise;
            await wait(3000);
        } finally {
            if (notificationID) {
                hideNotification(notificationID);
            }
        }
    });

    const handleManualSave = async () => {
        ensureMessageContent();
        await promiseUploadInProgress.current;
        // Split handlers to have the updated version of the message
        await handleManualSaveAfterUploads();
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
        const alreadySaved = !!cleanMessage.data.ID && !pendingSave.current && !hasChanged;
        autoSave.abort?.();

        const manager = createSendingMessageNotificationManager();
        // Display growler to receive direct feedback (UX) since sendMessage function is added to queue (and other async process could need to complete first)
        manager.ID = createNotification({
            text: <SendingMessageNotification manager={manager} />,
            expiration: -1,
            disableAutoClose: true,
        });

        // No await here to close the composer directly
        void addAction(async () => {
            try {
                await sendMessage(cleanMessage, mapSendPrefs, onCompose, alreadySaved, manager);
            } catch (error) {
                hideNotification(manager.ID);
                createNotification({
                    text: c('Error').t`Error while sending the message. Message is not sent`,
                    type: 'error',
                });
                console.error('Error while sending the message.', error);
                setSending(false);
                throw error;
            }
        });
        onClose();
    });

    const handleSend = useHandler(async () => {
        ensureMessageContent();
        setSending(true);
        await promiseUploadInProgress.current;
        // Split handlers to have the updated version of the message
        await handleSendAfterUploads();
    });

    const handleClick = async () => {
        if (minimized) {
            toggleMinimized();
        }
        onFocus();
    };
    const handleClose = async () => {
        ensureMessageContent();
        setClosing(true);
        try {
            if (pendingSave.current || uploadInProgress) {
                void handleManualSave().catch(() => {
                    createNotification({
                        text: c('Error').t`Draft could not be saved. Try again.`,
                        type: 'error',
                    });
                    onCompose({
                        existingDraft: {
                            localID: syncedMessage.localID,
                            data: syncedMessage.data,
                        },
                    });
                });
            }
        } finally {
            onClose();
        }
    };
    const handleEditorReady = useCallback(() => setEditorReady(true), []);
    const handleContentFocus = useCallback(() => {
        addressesBlurRef.current();
        onFocus(); // Events on the main div will not fire because the editor is in an iframe
    }, []);

    const style = computeComposerStyle(index, count, focus, minimized, maximized, breakpoints.isNarrow, windowSize);

    const { squireKeydownHandler, composerRef, attachmentTriggerRef } = useComposerHotkeys({
        handleClose,
        handleDelete,
        handleExpiration,
        handleManualSave,
        handlePassword,
        handleSend,
        toggleMinimized,
        toggleMaximized,
        lock: lock || !hasRecipients,
    });

    return (
        <div
            className={classnames([
                'composer flex flex-column no-outline',
                !focus && 'composer--is-blur',
                minimized && 'composer--is-minimized',
                maximized && 'composer--is-maximized',
            ])}
            style={style}
            onFocus={onFocus}
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            ref={composerRef}
            tabIndex={-1}
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
                        'composer-blur-container flex flex-column flex-item-fluid max-w100',
                        // Only hide the editor not to unload it each time a modal is on top
                        innerModal === ComposerInnerModal.None ? 'flex' : 'hidden',
                    ])}
                >
                    <div
                        ref={bodyRef}
                        className="composer-body-container flex flex-column flex-nowrap flex-item-fluid max-w100 mt0-5"
                    >
                        <ComposerMeta
                            message={modelMessage}
                            messageSendInfo={messageSendInfo}
                            disabled={!editorReady}
                            onChange={handleChange}
                            onChangeContent={handleChangeContent}
                            addressesBlurRef={addressesBlurRef}
                            addressesFocusRef={addressesFocusRef}
                        />
                        <ComposerContent
                            message={modelMessage}
                            disabled={lock}
                            breakpoints={breakpoints}
                            onEditorReady={handleEditorReady}
                            onChange={handleChange}
                            onChangeContent={handleChangeContent}
                            onChangeFlag={handleChangeFlag}
                            onFocus={handleContentFocus}
                            onAddAttachments={handleAddAttachmentsStart}
                            onCancelAddAttachment={handleCancelAddAttachment}
                            onRemoveAttachment={handleRemoveAttachment}
                            onRemoveUpload={handleRemoveUpload}
                            pendingFiles={pendingFiles}
                            pendingUploads={pendingUploads}
                            onSelectEmbedded={handleAddAttachmentsUpload}
                            contentFocusRef={contentFocusRef}
                            editorActionsRef={editorActionsRef}
                            squireKeydownHandler={squireKeydownHandler}
                        />
                    </div>
                    <ComposerActions
                        className={hasVerticalScroll ? 'composer-actions--has-scroll' : undefined}
                        message={modelMessage}
                        date={getDate(syncedMessage.data, '')}
                        lock={lock}
                        opening={opening}
                        sending={sending}
                        syncInProgress={syncInProgress}
                        onAddAttachments={handleAddAttachmentsStart}
                        onExpiration={handleExpiration}
                        onPassword={handlePassword}
                        onSend={handleSend}
                        onDelete={handleDelete}
                        addressesBlurRef={addressesBlurRef}
                        attachmentTriggerRef={attachmentTriggerRef}
                    />
                </div>
            </div>
        </div>
    );
};

export default Composer;
