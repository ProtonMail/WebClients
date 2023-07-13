import { Dispatch, MutableRefObject, RefObject, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { EditorActions, EditorMetadata, EditorTextDirection } from '@proton/components/components';
import { useAddresses, useHandler, useMailSettings, useNotifications, useUserSettings } from '@proton/components/hooks';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients, isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import { MessageChange } from '../../components/composer/Composer';
import { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';
import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { updateKeyPackets } from '../../helpers/attachment/attachment';
import { ATTACHMENT_ACTION } from '../../helpers/attachment/attachmentUploader';
import { getDate } from '../../helpers/elements';
import { getContent, getContentWithBlockquotes, setContent } from '../../helpers/message/messageContent';
import { isNewDraft } from '../../helpers/message/messageDraft';
import { replaceEmbeddedAttachments } from '../../helpers/message/messageEmbeddeds';
import { mergeMessages } from '../../helpers/message/messages';
import { ComposerID } from '../../logic/composers/composerTypes';
import {
    deleteDraft as deleteDraftAction,
    removeInitialAttachments,
    removeQuickReplyFlag,
    updateDraftContent,
    updateIsSavingFlag,
} from '../../logic/messages/draft/messagesDraftActions';
import { MessageState } from '../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../logic/store';
import { useInitializeMessage } from '../message/useInitializeMessage';
import { useGetMessage, useMessage } from '../message/useMessage';
import { useLongLivingState } from '../useLongLivingState';
import { useMessageSendInfo, useReloadSendInfo } from '../useSendInfo';
import { useAttachments } from './useAttachments';
import { useAutoSave } from './useAutoSave';
import { useCloseHandler } from './useCloseHandler';
import { ComposeTypes } from './useCompose';
import { EditorHotkeysHandlers, useComposerHotkeys } from './useComposerHotkeys';
import { useComposerInnerModals } from './useComposerInnerModals';
import { useDraftSenderVerification } from './useDraftSenderVerification';
import { useHandleMessageAlreadySent } from './useHandleMessageAlreadySent';
import useReduxRefac from './useReduxRefac';
import { useSendHandler } from './useSendHandler';

export enum EditorTypes {
    composer,
    quickReply,
}

export interface EditorComposer {
    type: EditorTypes.composer;
    editorRef: MutableRefObject<ExternalEditorActions | undefined>;
    addressesFocusRef?: MutableRefObject<() => void>;
    toggleMinimized?: () => void;
    toggleMaximized?: () => void;
    composerID: string;
}

export interface EditorQuickReply {
    type: EditorTypes.quickReply;
    editorRef: MutableRefObject<EditorActions | undefined>;
    referenceMessage?: MessageState;
    replyUpdated?: boolean;
    setReplyUpdated?: Dispatch<SetStateAction<boolean>>;
    setDeleteDraftModalOpen?: (newValue: boolean) => void;
    onNoAttachments?: (keyword: string) => Promise<unknown>;
}

export type EditorArgs = (EditorComposer | EditorQuickReply) & {
    messageID: string;
    onClose: () => void;
    composerFrameRef: RefObject<HTMLDivElement>;
    isFocused?: boolean;
    editorReady: boolean;
    composerID?: ComposerID;
};

export const useComposerContent = (args: EditorArgs) => {
    const [addresses] = useAddresses();
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const getMessage = useGetMessage();
    const onCompose = useOnCompose();
    const dispatch = useAppDispatch();
    const skipNextInputRef = useRef(false);

    const { messageID, onClose, composerFrameRef, type: editorType, isFocused, editorReady } = args;
    const isComposer = editorType === EditorTypes.composer;
    const isQuickReply = editorType === EditorTypes.quickReply;

    // Indicates that the composer is in its initial opening
    // Needed to be able to force focus only at first time
    const [opening, setOpening] = useState(true);

    // Use long living state so that we can use it from the send handler
    const [isSending, setIsSending] = useLongLivingState<boolean>(false);

    // Model value of the edited message in the composer
    const [modelMessage, setModelMessage, getModelMessage] = useLongLivingState<MessageState>({
        localID: messageID,
    });

    // Computed composer status
    const hasRecipients = getRecipients(modelMessage.data).length > 0;

    // Map of send preferences and send icons for each recipient
    const messageSendInfo = useMessageSendInfo(modelMessage);
    const reloadSendInfo = useReloadSendInfo();

    const { message: syncedMessage } = useMessage(messageID);

    const date = getDate(syncedMessage.data, '');
    const timestamp = date ? date.getTime() : 0;

    // Handles message already sent error
    const onMessageAlreadySent = useHandleMessageAlreadySent({
        modelMessage,
        onClose,
    });

    // All message actions
    const initialize = useInitializeMessage();

    const {
        autoSave,
        saveNow,
        deleteDraft,
        pendingSave,
        pendingAutoSave,
        pause: pauseAutoSave,
        restart: restartAutoSave,
    } = useAutoSave({ onMessageAlreadySent });

    useEffect(() => {
        if (isQuickReply && (pendingSave.isPending || pendingAutoSave.isPending)) {
            dispatch(updateIsSavingFlag({ ID: messageID, isSaving: true }));
        } else {
            dispatch(updateIsSavingFlag({ ID: messageID, isSaving: false }));
        }
    }, [pendingSave.isPending, pendingAutoSave.isPending]);

    const [blockquoteExpanded, setBlockquoteExpanded] = useState(true);

    const isPlainText = testIsPlainText(modelMessage.data);
    const rightToLeft = modelMessage.data?.RightToLeft
        ? EditorTextDirection.RightToLeft
        : EditorTextDirection.LeftToRight;
    const metadata: EditorMetadata = useMemo(
        () => ({
            supportPlainText: true,
            isPlainText,
            supportRightToLeft: true,
            rightToLeft,
            supportImages: true,
            supportDefaultFontSelector: true,
            blockquoteExpanded,
            setBlockquoteExpanded,
        }),
        [isPlainText, rightToLeft, blockquoteExpanded, setBlockquoteExpanded]
    );

    // Manage existing draft initialization
    useEffect(() => {
        if (
            !pendingSave.isPending &&
            (syncedMessage.data?.ID || (!syncedMessage.data?.ID && !isNewDraft(syncedMessage.localID))) &&
            syncedMessage.messageDocument?.initialized === undefined &&
            modelMessage.messageDocument?.initialized === undefined
        ) {
            void initialize(syncedMessage.localID);
        }
    }, [
        pendingSave.isPending,
        syncedMessage.localID,
        syncedMessage.data?.ID,
        syncedMessage.messageDocument?.initialized,
        modelMessage.messageDocument?.initialized,
    ]);

    // Manage populating the model from the server
    useEffect(() => {
        // Draft creation
        if (modelMessage.data?.ID !== syncedMessage.data?.ID) {
            const newModelMessage = {
                ...syncedMessage,
                ...modelMessage,
                data: {
                    ...syncedMessage.data,
                    ...modelMessage.data,
                    // Attachments are updated by the draft creation request
                    Attachments: syncedMessage.data?.Attachments,
                } as Message,
                messageImages: replaceEmbeddedAttachments(modelMessage, syncedMessage.data?.Attachments),
            };

            setModelMessage(newModelMessage);
        } else {
            // Draft update
            const { changed, Attachments } = updateKeyPackets(modelMessage, syncedMessage);
            if (changed) {
                setModelMessage({
                    ...modelMessage,
                    data: { ...modelMessage.data, Attachments } as Message,
                    messageImages: replaceEmbeddedAttachments(modelMessage, Attachments),
                });
            }
        }
    }, [pendingSave.isPending, syncedMessage.data?.ID]);

    // Manage initializing the message from an existing draft
    useEffect(() => {
        const firstInitialization =
            !modelMessage.messageDocument?.initialized && syncedMessage.messageDocument?.initialized;

        if (firstInitialization) {
            const isOpenFromUndo = syncedMessage.draftFlags?.openDraftFromUndo === true;
            const password = isOpenFromUndo
                ? // Keep password on undo
                  {}
                : // Forget previously set password if kept in the cache
                  { Password: undefined, PasswordHint: undefined };

            const documentCloned = syncedMessage.messageDocument?.document?.cloneNode(true) as Element;
            const newModelMessage = {
                ...syncedMessage,
                ...modelMessage,
                data: {
                    ...syncedMessage.data,
                    ...password,
                    ...modelMessage.data,
                    Attachments: syncedMessage.data?.Attachments,
                } as Message,
                messageDocument: {
                    ...syncedMessage.messageDocument,
                    document: documentCloned,
                    initialized: true,
                },
                messageImages: syncedMessage.messageImages,
            };

            // If the message was expanded from a quick reply, we need to save it because it might not be saved yet
            // and to remove the flag otherwise the element will not be displayed in the conversation view
            if (isComposer && newModelMessage.draftFlags?.isQuickReply) {
                dispatch(removeQuickReplyFlag(modelMessage.localID));
                void autoSave(newModelMessage);
            }

            setModelMessage(newModelMessage);
            void reloadSendInfo(messageSendInfo, newModelMessage);
        }
    }, [
        pendingSave.isPending,
        syncedMessage.messageDocument?.document,
        syncedMessage.messageDocument?.plainText,
        syncedMessage.messageDocument?.initialized,
    ]);

    const timeoutRef = useRef(0);

    // Manage focus at opening
    useEffect(() => {
        if (!opening && isQuickReply) {
            const { editorRef } = args;
            editorRef.current?.focus();
            // In plaintext quick reply, the textarea is scrolled to bottom by default
            if (isPlainText) {
                editorRef.current?.scroll?.({ top: 0 });
            }
        } else if (isComposer && !opening && isFocused) {
            const { addressesFocusRef, editorRef } = args;
            timeoutRef.current = window.setTimeout(() => {
                if (getRecipients(syncedMessage.data).length === 0) {
                    addressesFocusRef?.current();
                } else {
                    editorRef.current?.focus();
                }
            });
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [opening, isFocused]);

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
            if (isQuickReply) {
                const { referenceMessage, replyUpdated, setReplyUpdated, editorRef } = args;
                // Rooster (but not plaintext) triggers an onContentChange event when the initial content is inserted
                if (!isPlainText && skipNextInputRef.current) {
                    skipNextInputRef.current = false;
                    return;
                }

                if (!mailSettings || !referenceMessage) {
                    return;
                }

                if (!replyUpdated) {
                    setReplyUpdated?.(true);
                }

                setModelMessage((modelMessage) => {
                    const newModelMessageContent = getContentWithBlockquotes(
                        content,
                        isPlainText,
                        referenceMessage,
                        mailSettings,
                        userSettings,
                        addresses,
                        modelMessage.draftFlags?.action || MESSAGE_ACTIONS.REPLY
                    );
                    setContent(modelMessage, newModelMessageContent);
                    const newModelMessage = { ...modelMessage };

                    dispatch(
                        updateDraftContent({
                            ID: newModelMessage.localID,
                            content: newModelMessageContent,
                        })
                    );

                    if (!silent) {
                        void autoSave(newModelMessage);
                    } else {
                        // Only the first initialisation should be silent,
                        // in that case we don't want to trigger a change and a save
                        skipNextInputRef.current = true;
                    }

                    if (refreshEditor) {
                        editorRef.current?.setContent(content);
                    }
                    return newModelMessage;
                });
            } else if (isComposer) {
                const { editorRef } = args;
                setModelMessage((modelMessage) => {
                    setContent(modelMessage, content);
                    const newModelMessage = { ...modelMessage };

                    dispatch(
                        updateDraftContent({
                            ID: newModelMessage.localID,
                            content: content,
                        })
                    );

                    if (!silent) {
                        void autoSave(newModelMessage);
                    }
                    if (refreshEditor) {
                        editorRef.current?.setContent(newModelMessage);
                    }
                    return newModelMessage;
                });
            }
        }
    );

    /**
     * In some rare situations, Squire can miss an input event.
     * A missed event can lead to not sending the expected content which is serious.
     * This function perform an ultimate content check before sending especially.
     */
    const ensureMessageContent = () => {
        let actualContent;
        let modelContent;

        if (isQuickReply) {
            const { referenceMessage, replyUpdated, editorRef } = args;
            if (!editorRef.current || editorRef.current.isDisposed() || !referenceMessage || !mailSettings) {
                return;
            }

            const actualContentInEditor = editorRef?.current?.getContent();
            // The editor does not contain the reply, so we need to add it
            actualContent = getContentWithBlockquotes(
                actualContentInEditor,
                isPlainText,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                modelMessage.draftFlags?.action || MESSAGE_ACTIONS.REPLY
            );
            modelContent = getContent(modelMessage);

            // Do not handle change content if reply has not been updated
            if (actualContent.trim() !== modelContent.trim() && replyUpdated) {
                handleChangeContent(actualContent);
            }
        } else if (isComposer) {
            const { editorRef } = args;
            if (!editorRef.current || editorRef.current.isDisposed()) {
                return;
            }
            actualContent = editorRef.current.getContent();
            modelContent = getContent(modelMessage);

            if (actualContent.trim() !== modelContent.trim()) {
                handleChangeContent(actualContent);
            }
        }
    };

    /**
     * Ensure the draft is saved before continue
     */
    const handleSaveNow = async () => {
        if (!modelMessage.data?.ID) {
            return saveNow(modelMessage);
        }
    };

    const {
        pendingFiles,
        pendingUploads,
        promiseUpload,
        uploadInProgress,
        handleAddAttachmentsStart,
        handleAddAttachmentsUpload,
        handleCancelAddAttachment,
        handleRemoveAttachment,
        handleRemoveUpload,
    } = useAttachments({
        message: modelMessage,
        onChange: handleChange,
        onSaveNow: handleSaveNow,
        editorActionsRef: isComposer ? args.editorRef : undefined,
        onMessageAlreadySent,
    });

    // Manage opening
    useEffect(() => {
        // New attachments to upload from scratch
        const attachmentToUpload = !!syncedMessage.draftFlags?.initialAttachments?.length;

        if (attachmentToUpload) {
            const uploadInitialAttachments = async () => {
                const files = syncedMessage.draftFlags?.initialAttachments;
                dispatch(removeInitialAttachments(messageID));
                await saveNow(syncedMessage);
                await handleAddAttachmentsUpload(ATTACHMENT_ACTION.ATTACHMENT, files);
            };
            void uploadInitialAttachments();
        }

        if (editorReady && syncedMessage.messageDocument?.initialized && !attachmentToUpload) {
            setOpening(false);
        }
    }, [editorReady, syncedMessage.data, syncedMessage.messageDocument?.initialized]);

    /**
     * When opening a draft we also want to check that the message Sender is valid
     * If a message is imported through EasySwitch or the sender address has been deleted in the meantime,
     * we want to replace the Sender by the account default address
     */
    const { verifyDraftSender, modal: senderVerificationModal } = useDraftSenderVerification({
        onChange: handleChange,
        composerID: isQuickReply ? '' : args.composerID,
    });

    useEffect(() => {
        const handleVerify = async () => {
            await verifyDraftSender(modelMessage);
        };

        if (modelMessage.messageDocument?.initialized) {
            void handleVerify();
        }
    }, [modelMessage.messageDocument?.initialized]);

    const handleDiscard = async (hasChanges = true) => {
        if (isQuickReply) {
            const message = getMessage(modelMessage.localID);
            if (message) {
                await deleteDraft(message);
            }

            // We can remove the draft from the state
            if (modelMessage.localID) {
                void dispatch(deleteDraftAction(modelMessage.localID));
            }
        } else {
            const message = getMessage(messageID);
            if (message) {
                await deleteDraft(message);
            }
        }

        // Do not display the notification if the draft has no changes
        if (hasChanges) {
            createNotification({ text: c('Info').t`Draft discarded` });
        }
    };

    const handleDelete = async (hasChanges = true) => {
        autoSave.cancel?.();
        try {
            onClose();
            await handleDiscard(hasChanges);
        } catch {
            // Nothing
        }
    };

    const { saving, handleManualSave, handleClose } = useCloseHandler({
        syncedMessage,
        modelMessage,
        lock: opening,
        ensureMessageContent,
        autoSave,
        saveNow,
        onClose,
        onDiscard: handleDiscard,
        pendingAutoSave,
        promiseUpload,
        uploadInProgress,
        onMessageAlreadySent,
    });

    const {
        innerModal,
        setInnerModal,
        attachmentsFoundKeyword,
        handlePassword,
        handleExpiration,
        handleCloseInnerModal,
        handleDeleteDraft: handleOpenDeleteDraftModal,
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleCloseInsertImageModal,
        handleSendAnyway,
        handleCancelSend,
    } = useComposerInnerModals({
        pendingFiles,
        handleCancelAddAttachment,
    });

    const handleSend = useSendHandler({
        getModelMessage,
        setModelMessage,
        ensureMessageContent,
        mapSendInfo: messageSendInfo.mapSendInfo,
        promiseUpload,
        pendingSave,
        pendingAutoSave,
        autoSave,
        saveNow,
        onClose,
        onMessageAlreadySent,
        setIsSending,
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments: isQuickReply ? args.onNoAttachments : handleNoAttachments,
        isQuickReply,
    });

    const handleSendQuickReply = async () => {
        // Can send only if a modification has been made, otherwise we can send empty message with the shortcut
        if (isQuickReply && args.replyUpdated && !isSending) {
            setIsSending(true);
            dispatch(removeQuickReplyFlag(modelMessage.localID));
            void handleSend({ sendAsScheduled: false })();
        }
    };

    const handleDeleteQuickReplyFromShortcut = async () => {
        void handleDelete();
        onClose();
    };

    const handleExpandComposer = () => {
        autoSave.cancel?.();
        onCompose({ type: ComposeTypes.fromMessage, modelMessage });
    };

    const lock = opening || !hasRecipients;

    const hasHotkeysEnabled = mailSettings?.Shortcuts === 1;

    const composerHotkeysArgs: EditorHotkeysHandlers = isComposer
        ? {
              type: EditorTypes.composer,
              composerRef: composerFrameRef,
              handleClose,
              handleDelete,
              handleExpiration,
              handleManualSave,
              handlePassword,
              handleSend: handleSend({ sendAsScheduled: false }),
              toggleMinimized: args.toggleMinimized || noop,
              toggleMaximized: args.toggleMaximized || noop,
              lock,
              saving,
              hasHotkeysEnabled,
              editorRef: args.editorRef,
          }
        : {
              type: EditorTypes.quickReply,
              composerRef: composerFrameRef,
              handleDelete: handleDeleteQuickReplyFromShortcut,
              handleManualSave,
              handleSend: handleSendQuickReply,
              toggleMaximized: handleExpandComposer,
              lock,
              saving,
              hasHotkeysEnabled,
              editorRef: args.editorRef,
          };

    const attachmentTriggerRef = useComposerHotkeys(composerHotkeysArgs);

    const handleDeleteDraft = () => {
        if (isQuickReply) {
            const { setDeleteDraftModalOpen } = args;
            const messageFromState = getMessage(modelMessage.localID);
            // If the message has no changes yet, delete it without opening the delete draft inner modal
            if (
                messageFromState &&
                !messageFromState.data?.ID &&
                !pendingSave.isPending &&
                !pendingAutoSave.isPending
            ) {
                void handleDelete(false);
            } else {
                setDeleteDraftModalOpen?.(true);
            }
        } else {
            // If the message has no changes yet, delete it without opening the delete draft inner modal
            if (!modelMessage.data?.ID && !pendingSave.isPending && !pendingAutoSave.isPending) {
                void handleDelete(false);
            } else {
                handleOpenDeleteDraftModal();
            }
        }
    };

    useReduxRefac({ composerID: args.composerID, handleChange, handleChangeContent, modelMessage });

    return {
        modelMessage,
        setModelMessage,
        syncedMessage,
        date,
        timestamp,
        metadata,
        rightToLeft,
        isPlainText,
        isSending,
        opening,
        handleChange,
        handleChangeContent,
        handleSend,
        handleDeleteDraft,
        handleDelete,
        handleClose,
        senderVerificationModal,

        // Inner modals
        innerModal,
        setInnerModal,
        attachmentsFoundKeyword,
        handlePassword,
        handleExpiration,
        handleCloseInnerModal,
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleCloseInsertImageModal,
        handleSendAnyway,
        handleCancelSend,

        // Save
        autoSave,
        pendingSave,
        pauseAutoSave,
        restartAutoSave,
        messageSendInfo,
        reloadSendInfo,

        // Attachments
        attachmentTriggerRef,
        pendingFiles,
        pendingUploads,
        uploadInProgress,
        handleAddAttachmentsStart,
        handleAddAttachmentsUpload,
        handleRemoveAttachment,
        handleRemoveUpload,

        // Quick reply specific
        handleExpandComposer,
        handleSendQuickReply,
    };
};
