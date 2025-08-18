import type { MutableRefObject, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import type { EditorMetadata } from '@proton/components';
import { useHandler, useNotifications } from '@proton/components';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { getHasAssistantStatus } from '@proton/llm/lib';
import type { OpenedAssistant } from '@proton/llm/lib/types';
import { OpenedAssistantStatus } from '@proton/llm/lib/types';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';
import { DIRECTION, SHORTCUTS } from '@proton/shared/lib/mail/mailSettings';
import { getRecipients, isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import { sanitizeComposerReply } from '@proton/shared/lib/sanitize/purify';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import type { ComposerReturnType } from 'proton-mail/helpers/composer/contentFromComposerMessage';
import {
    getMessageContentBeforeBlockquote,
    setMessageContentBeforeBlockquote,
} from 'proton-mail/helpers/composer/contentFromComposerMessage';
import { insertSignature } from 'proton-mail/helpers/message/messageSignature';
import { MOVE_BACK_ACTION_TYPES } from 'proton-mail/hooks/actions/moveBackAction/interfaces';
import { useMoveBackAction } from 'proton-mail/hooks/actions/moveBackAction/useMoveBackAction';
import { useLoadEmbeddedImages, useLoadRemoteImages } from 'proton-mail/hooks/message/useLoadImages';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { selectComposer } from 'proton-mail/store/composers/composerSelectors';
import { composerActions } from 'proton-mail/store/composers/composersSlice';
import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';
import { messageByID } from 'proton-mail/store/messages/messagesSelectors';

import type { MessageChange } from '../../components/composer/Composer';
import type { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';
import { updateKeyPackets } from '../../helpers/attachment/attachment';
import { getDate } from '../../helpers/elements';
import {
    exportPlainText,
    getComposerDefaultFontStyles,
    getContent,
    setContent,
} from '../../helpers/message/messageContent';
import { isNewDraft } from '../../helpers/message/messageDraft';
import { replaceEmbeddedAttachments } from '../../helpers/message/messageEmbeddeds';
import { mergeMessages } from '../../helpers/message/messages';
import type { ComposerID } from '../../store/composers/composerTypes';
import { removeInitialAttachments, updateDraftContent } from '../../store/messages/draft/messagesDraftActions';
import { useInitializeMessage } from '../message/useInitializeMessage';
import { useGetMessage, useMessage } from '../message/useMessage';
import { useLongLivingState } from '../useLongLivingState';
import { useMessageSendInfo, useReloadSendInfo } from '../useSendInfo';
import { useAttachments } from './useAttachments';
import { useAutoSave } from './useAutoSave';
import { useCloseHandler } from './useCloseHandler';
import { useComposerHotkeys } from './useComposerHotkeys';
import { useComposerInnerModals } from './useComposerInnerModals';
import { useDraftSenderVerification } from './useDraftSenderVerification';
import { useHandleMessageAlreadySent } from './useHandleMessageAlreadySent';
import useReduxRefac from './useReduxRefac';
import { useSendHandler } from './useSendHandler';

export type EditorArgs = {
    onClose: () => void;
    composerFrameRef: RefObject<HTMLDivElement>;
    isFocused?: boolean;
    editorReady: boolean;
    editorRef: MutableRefObject<ExternalEditorActions | undefined>;
    addressesFocusRef?: MutableRefObject<() => void>;
    toggleMinimized?: () => void;
    toggleMaximized?: () => void;
    composerID: ComposerID;
    minimizeButtonRef: RefObject<HTMLButtonElement>;
    openedAssistants: OpenedAssistant[];
    openAssistant: (id: string) => void;
    closeAssistant: (id: string) => void;
    setAssistantStatus: (id: string, status: OpenedAssistantStatus) => void;
    handleResetAssistantState: () => void;
};

export const useComposerContent = (args: EditorArgs) => {
    const [addresses = []] = useAddresses();
    const mailSettings = useMailModel('MailSettings');
    const isRemoveReplyStyleEnabled = useFlag('RemoveReplyStyles');
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const getMessage = useGetMessage();
    const dispatch = useMailDispatch();
    const store = useMailStore();

    const handleOnBackMoveAction = useMoveBackAction();

    const { onClose, composerFrameRef, isFocused, editorReady } = args;

    const messageID = useMemo(() => {
        const composer = selectComposer(store.getState(), args.composerID);
        return composer.messageID;
    }, []);

    // Indicates that the composer is in its initial opening
    // Needed to be able to force focus only at first time
    const [opening, setOpening] = useState(true);

    // Use long living state so that we can use it from the send handler
    const [isSending, setIsSending] = useLongLivingState<boolean>(false);

    // Model value of the edited message in the composer
    const [modelMessage, setModelMessage, getModelMessage] = useLongLivingState<MessageState>({
        localID: messageID,
    });

    const newDraftImageLoadingStatus = useRef<'not-loaded' | 'loading' | 'loaded'>('not-loaded');
    const loadRemoteImages = useLoadRemoteImages(messageID);
    const loadEmbeddedImages = useLoadEmbeddedImages(messageID);

    // Computed composer status
    const hasRecipients = getRecipients(modelMessage.data).length > 0;

    // Map of send preferences and send icons for each recipient
    const messageSendInfo = useMessageSendInfo(modelMessage);
    const reloadSendInfo = useReloadSendInfo();

    const [hasUsedAssistantText, setHasUsedAssistantText] = useState(false);
    const { sendSendMessageAssistantReport } = useAssistantTelemetry();

    const isAssistantExpanded = useMemo(() => {
        return getHasAssistantStatus(args.openedAssistants, args.composerID, OpenedAssistantStatus.EXPANDED);
    }, [args]);

    const handleCloseAssistant = () => {
        const { composerID, closeAssistant } = args;
        closeAssistant(composerID);
    };

    const handleCollapseAssistant = () => {
        const { composerID, setAssistantStatus } = args;
        if (isAssistantExpanded) {
            args.handleResetAssistantState();
            setAssistantStatus(composerID, OpenedAssistantStatus.COLLAPSED);
        }
    };

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
        hasNetworkError,
    } = useAutoSave({ onMessageAlreadySent });

    const [blockquoteExpanded, setBlockquoteExpanded] = useState(true);

    const isPlainText = testIsPlainText(modelMessage.data);
    const rightToLeft = modelMessage.data?.RightToLeft ? DIRECTION.RIGHT_TO_LEFT : DIRECTION.LEFT_TO_RIGHT;
    const metadata: EditorMetadata = useMemo(
        () => ({
            supportPlainText: true,
            isPlainText,
            supportRightToLeft: true,
            rightToLeft,
            supportFiles: true,
            supportDefaultFontSelector: true,
            blockquoteExpanded,
            setBlockquoteExpanded,
        }),
        [isPlainText, rightToLeft, blockquoteExpanded, setBlockquoteExpanded]
    );

    // Manage existing draft initialization
    useEffect(() => {
        const initDraft = async () => {
            if (
                !pendingSave.isPending &&
                (syncedMessage.data?.ID || (!syncedMessage.data?.ID && !isNewDraft(syncedMessage.localID))) &&
                syncedMessage.messageDocument?.initialized === undefined &&
                modelMessage.messageDocument?.initialized === undefined
            ) {
                await initialize(syncedMessage.localID);
                const initializedMessage = messageByID(store.getState(), { ID: syncedMessage.localID });

                const composerID = args.composerID;
                if (initializedMessage?.data && composerID) {
                    dispatch(composerActions.setInitialized({ ID: composerID, message: initializedMessage }));
                }
            }
        };
        void initDraft();
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

    const handleLoadImages = async () => {
        newDraftImageLoadingStatus.current = 'loading';
        await loadRemoteImages();
        await loadEmbeddedImages();
        newDraftImageLoadingStatus.current = 'loaded';
    };

    // Manage initializing modelMessage document
    useEffect(() => {
        /* Before initializing the composer (initializing modelMessage document), we want to make sure all images are loaded.
         * However, there are two cases:
         * 1- Opening an old draft
         *      The message has already been initialized in the past,
         *      so we simply have to wait for all the images to be loaded in redux (if any) before displaying the message
         * 2- Creating a new draft
         *      The message is new, so we first need to manually "load all images"
         *      (Which consist on replacing imgs src attributes with proton-src so that we can load them using proxy).
         *      Then once they are "loaded" in redux, we can initialize the message in the composer
         */

        const hasImages =
            syncedMessage.messageImages?.hasEmbeddedImages || syncedMessage.messageImages?.hasRemoteImages;

        // First, if the message is a new draft. and we haven't loaded the images yet, load them.
        const messageIsNewDraft = isNewDraft(syncedMessage.localID);
        if (messageIsNewDraft && newDraftImageLoadingStatus.current === 'not-loaded' && hasImages) {
            void handleLoadImages();
            return;
        }

        // If all images have been loaded and this is the first initialization,
        // then we can initialize modelMessage to display some content in the composer
        const messageImagesLoaded =
            !hasImages || syncedMessage.messageImages?.images.every((img) => img.status === 'loaded');
        const firstInitialization =
            !modelMessage.messageDocument?.initialized &&
            syncedMessage.messageDocument?.initialized &&
            messageImagesLoaded;

        if (firstInitialization) {
            const isOpenFromUndo = syncedMessage.draftFlags?.openDraftFromUndo === true;
            const password = isOpenFromUndo
                ? // Keep password on undo
                  {}
                : // Forget previously set password if kept in the cache
                  { Password: undefined, PasswordHint: undefined };

            const documentCloned = syncedMessage.messageDocument?.document?.cloneNode(true) as Element;
            // Sanitize the document to remove unwanted tags (like <style>) from blockquote sections.
            // This prevents potential styling issues and security vulnerabilities when rendering quoted content.
            if (isRemoveReplyStyleEnabled) {
                sanitizeComposerReply(documentCloned);
            }

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

            setModelMessage(newModelMessage);
            void reloadSendInfo(messageSendInfo, newModelMessage);
        }
    }, [
        pendingSave.isPending,
        syncedMessage.localID,
        syncedMessage.messageDocument?.document,
        syncedMessage.messageDocument?.plainText,
        syncedMessage.messageDocument?.initialized,
        syncedMessage.messageImages,
    ]);

    const timeoutRef = useRef(0);

    // Manage focus at opening
    useEffect(() => {
        if (!opening && isFocused) {
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
    );

    /**
     * Returns plain text content before the blockquote and signature in the editor
     */
    const getContentBeforeBlockquote = (returnType: ComposerReturnType = 'plaintext') => {
        const editorType = isPlainText ? 'plaintext' : 'html';
        const editorContent = args.editorRef.current?.getContent() || '';

        // Plain text only
        const addressSignature = (() => {
            const content = insertSignature(
                '',
                addresses.find((address) => address.Email === modelMessage.data?.Sender?.Address)?.Signature || '',
                modelMessage.draftFlags?.action || MESSAGE_ACTIONS.NEW,
                mailSettings,
                userSettings,
                undefined,
                false
            );

            return exportPlainText(content);
        })();

        return getMessageContentBeforeBlockquote({
            editorType,
            editorContent,
            addressSignature,
            returnType,
        });
    };

    const setContentBeforeBlockquote = (content: string) => {
        const editorType = isPlainText ? 'plaintext' : 'html';
        const editorContent = args.editorRef.current?.getContent() || '';

        // Plain text only
        const addressSignature = (() => {
            const content = insertSignature(
                '',
                addresses.find((address) => address.Email === modelMessage.data?.Sender?.Address)?.Signature || '',
                modelMessage.draftFlags?.action || MESSAGE_ACTIONS.NEW,
                mailSettings,
                userSettings,
                undefined,
                false
            );
            return exportPlainText(content);
        })();

        const nextContent = setMessageContentBeforeBlockquote({
            editorType,
            editorContent,
            content,
            wrapperDivStyles: getComposerDefaultFontStyles(mailSettings),
            addressSignature,
            messageID: modelMessage.localID,
        });

        return handleChangeContent(nextContent, true);
    };

    /**
     * In some rare situations, Squire can miss an input event.
     * A missed event can lead to not sending the expected content which is serious.
     * This function perform an ultimate content check before sending especially.
     */
    const ensureMessageContent = () => {
        const { editorRef } = args;
        if (!editorRef.current || editorRef.current.isDisposed()) {
            return;
        }
        const actualContent = editorRef.current.getContent();
        const modelContent = getContent(modelMessage);

        if (actualContent.trim() !== modelContent.trim()) {
            handleChangeContent(actualContent);
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
        saveNow,
        editorActionsRef: args.editorRef,
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
                await handleAddAttachmentsUpload(ATTACHMENT_DISPOSITION.ATTACHMENT, files);
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
        composerID: args.composerID,
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
        // Handle message move out if necessary
        if (modelMessage.data?.ID) {
            handleOnBackMoveAction({ type: MOVE_BACK_ACTION_TYPES.PERMANENT_DELETE, elements: [modelMessage.data] });
        }

        const message = getMessage(messageID);
        if (message) {
            await deleteDraft(message);
        }

        // Do not display the notification if the draft has no changes
        if (hasChanges) {
            createNotification({ text: c('Info').t`Draft discarded` });
        }
    };

    const handleDelete = async (hasChanges = true) => {
        handleCloseAssistant();
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
        hasNetworkError,
    });

    const {
        innerModal,
        setInnerModal,
        attachmentsFoundKeyword,
        noReplyEmail,
        handlePassword,
        handleExpiration,
        handleCloseInnerModal,
        handleDeleteDraft: handleOpenDeleteDraftModal,
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleNoReplyEmail,
        handleCloseInsertImageModal,
        handleSendAnyway,
        handleCancelSend,
    } = useComposerInnerModals({
        pendingFiles,
        handleCancelAddAttachment,
    });

    const handleSendAssistantReport = () => {
        if (hasUsedAssistantText) {
            sendSendMessageAssistantReport();
        }
    };

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
        handleNoAttachments: handleNoAttachments,
        handleNoReplyEmail,
        hasNetworkError,
        onSendAssistantReport: handleSendAssistantReport,
    });

    const lock = opening || !hasRecipients;

    const hasHotkeysEnabled = mailSettings.Shortcuts === SHORTCUTS.ENABLED;

    const attachmentTriggerRef = useComposerHotkeys({
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
        minimizeButtonRef: args.minimizeButtonRef,
        isAssistantExpanded,
        closeAssistant: handleCloseAssistant,
        collapseAssistant: handleCollapseAssistant,
    });

    const handleDeleteDraft = () => {
        // If the message has no changes yet, delete it without opening the delete draft inner modal
        if (!modelMessage.data?.ID && !pendingSave.isPending && !pendingAutoSave.isPending) {
            void handleDelete(false);
        } else {
            handleOpenDeleteDraftModal();
        }
    };

    useReduxRefac({
        composerID: args.composerID,
        handleChange,
        handleChangeContent,
        modelMessage,
    });

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
        getContentBeforeBlockquote,
        setContentBeforeBlockquote,
        handleDeleteDraft,
        handleDelete,
        handleClose,
        senderVerificationModal,

        // Inner modals
        innerModal,
        setInnerModal,
        attachmentsFoundKeyword,
        noReplyEmail,
        handlePassword,
        handleExpiration,
        handleCloseInnerModal,
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleNoReplyEmail,
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

        // Assistant
        setHasUsedAssistantText,
    };
};
