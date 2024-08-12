import type { DragEvent, Ref, RefObject } from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { useHandler, useLocalState, useSubscribeEventManager, useUserSettings } from '@proton/components';
import { getHasAssistantStatus, getIsAssistantOpened } from '@proton/llm/lib';
import { useAssistant } from '@proton/llm/lib/hooks/useAssistant';
import { OpenedAssistantStatus } from '@proton/llm/lib/types';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { clearBit, setBit } from '@proton/shared/lib/helpers/bitset';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { getPublicRecipients, getRecipients, getSender } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import ComposerAssistant from 'proton-mail/components/assistant/ComposerAssistant';
import { insertTextBeforeContent, sanitizeContentToInsert } from 'proton-mail/helpers/message/messageContent';
import { removeLineBreaks } from 'proton-mail/helpers/string';
import useMailModel from 'proton-mail/hooks/useMailModel';

import { DRAG_ADDRESS_KEY } from '../../constants';
import { EditorTypes, useComposerContent } from '../../hooks/composer/useComposerContent';
import { ComposerInnerModalStates } from '../../hooks/composer/useComposerInnerModals';
import { useScheduleSend } from '../../hooks/composer/useScheduleSend';
import { useHasScroll } from '../../hooks/useHasScroll';
import type { Event } from '../../models/event';
import type { MessageState, MessageStateWithData, PartialMessageState } from '../../store/messages/messagesTypes';
import ComposerContent from './ComposerContent';
import ComposerMeta from './ComposerMeta';
import ComposerActions from './actions/ComposerActions/ComposerActions';
import type { ExternalEditorActions } from './editor/EditorWrapper';
import ComposerInnerModals from './modals/ComposerInnerModals';

export type MessageUpdate = PartialMessageState | ((message: MessageState) => PartialMessageState);

export interface MessageChange {
    (update: MessageUpdate, reloadSendInfo?: boolean): void;
}

export interface MessageChangeFlag {
    (changes: Map<number, boolean>, reloadSendInfo?: boolean): void;
}

export interface ComposerAction {
    close: () => void;
}

interface Props {
    composerID: string;
    composerFrameRef: RefObject<HTMLDivElement>;
    toggleMinimized: () => void;
    toggleMaximized: () => void;
    onFocus: () => void;
    onClose: () => void;
    onSubject: (subject: string) => void;
    isFocused: boolean;
    minimizeButtonRef: RefObject<HTMLButtonElement>;
}

const Composer = (
    {
        composerID,
        composerFrameRef,
        toggleMinimized,
        toggleMaximized,
        onFocus,
        onClose: inputOnClose,
        onSubject,
        isFocused,
        minimizeButtonRef,
    }: Props,
    ref: Ref<ComposerAction>
) => {
    const [displayToolbar, setDisplayToolbar] = useLocalState(true, 'composer-toolbar-expanded');
    const toolbarWrapperRef = useRef<HTMLDivElement>(null);
    const mailSettings = useMailModel('MailSettings');
    const [userSettings] = useUserSettings();
    const [selectedText, setSelectedText] = useState('');

    const bodyRef = useRef<HTMLDivElement>(null);
    const [hasVerticalScroll] = useHasScroll(bodyRef);
    const composerContentRef = useRef<HTMLElement>(null);
    const composerContainerRef = useRef<HTMLDivElement>(null);
    const composerMetaRef = useRef<HTMLDivElement>(null);

    const setAssistantStateRef = useRef(noop);

    const {
        openedAssistants,
        openAssistant,
        closeAssistant,
        setAssistantStatus,
        canShowAssistant,
        hasCompatibleBrowser,
        hasCompatibleHardware,
        initAssistant,
        downloadPaused,
        getIsStickyAssistant,
        cancelRunningAction,
    } = useAssistant(composerID);

    // onClose handler can be called in an async handler
    // Input onClose ref can change in the meantime
    const inputCloseHandler = useHandler(inputOnClose);

    const onClose = () => {
        // Close the assistant when closing the composer
        closeAssistant(composerID);

        inputCloseHandler();
    };

    // Indicates that the composer is open but the edited message is not yet ready
    // Needed to prevent edition while data is not ready
    const [editorReady, setEditorReady] = useState(false);

    const editorRef = useRef<ExternalEditorActions>();
    const handleEditorReady = useCallback((editorActions: ExternalEditorActions) => {
        setEditorReady(true);
        editorRef.current = editorActions;
    }, []);

    // Manage focus from the container yet keeping logic in each component
    const addressesBlurRef = useRef<() => void>(noop);
    const addressesFocusRef = useRef<() => void>(noop);

    const handleDragEnter = (event: DragEvent) => {
        if (event.dataTransfer?.types.includes(DRAG_ADDRESS_KEY)) {
            onFocus();
        }
    };

    const handleResetAssistantState = () => {
        cancelRunningAction();
        setAssistantStateRef.current();
    };

    const {
        modelMessage,
        setModelMessage,
        date,
        timestamp,
        metadata,
        opening,
        handleChange,
        handleChangeContent,
        handleSend,
        handleDeleteDraft,
        handleDelete,
        handleClose,
        senderVerificationModal,

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

        pendingSave,
        pauseAutoSave,
        restartAutoSave,
        messageSendInfo,
        reloadSendInfo,

        attachmentTriggerRef,
        pendingFiles,
        pendingUploads,
        uploadInProgress,
        handleAddAttachmentsStart,
        handleAddAttachmentsUpload,
        handleRemoveAttachment,
        handleRemoveUpload,

        setHasUsedAssistantText,
        getContentBeforeBlockquote,
        setContentBeforeBlockquote,
    } = useComposerContent({
        type: EditorTypes.composer,
        composerID,
        onClose,
        addressesFocusRef,
        isFocused,
        toggleMaximized,
        toggleMinimized,
        composerFrameRef,
        editorRef,
        editorReady,
        minimizeButtonRef,
        openedAssistants,
        openAssistant,
        closeAssistant,
        setAssistantStatus,
        handleResetAssistantState,
    });

    // Update subject on ComposerFrame
    useEffect(() => {
        onSubject(modelMessage.data?.Subject || c('Title').t`New message`);
    }, [modelMessage.data?.Subject]);

    // Listen to event manager to trigger reload send info
    useSubscribeEventManager(({ Contacts = [] }: Event) => {
        if (!Contacts.length) {
            return;
        }

        let shouldReloadSendInfo = false;

        const updatedAddresses = Contacts.map(({ Action, Contact }) => {
            if (Action === EVENT_ACTIONS.DELETE) {
                // If a contact has been deleted, we lost the associated emails
                // No way to match addresses, we reload info by security
                shouldReloadSendInfo = true;
            }

            return Contact?.ContactEmails.map(({ Email }) => canonicalizeEmail(Email)) || [];
        }).flat();

        const recipientsAddresses = getRecipients(modelMessage.data).map(({ Address }) => canonicalizeEmail(Address));

        const matches = updatedAddresses.find((address) => recipientsAddresses.includes(address));

        shouldReloadSendInfo = shouldReloadSendInfo || !!matches;

        if (shouldReloadSendInfo) {
            void reloadSendInfo(messageSendInfo, modelMessage);
        }
    });

    const isAssistantOpenedInComposer = getIsAssistantOpened(openedAssistants, composerID);

    // Set manual to false when you want to open/close the assistant without setting the localstorage value
    const handleToggleAssistant = (manual = true, aiFlag = userSettings.AIAssistantFlags) => {
        if (isAssistantOpenedInComposer) {
            closeAssistant(composerID, manual);
        } else {
            if (aiFlag === AI_ASSISTANT_ACCESS.UNSET) {
                setInnerModal(ComposerInnerModalStates.AssistantSettings);
                return;
            }

            // When in local mode, we can only run one prompt at a time. It's better
            // to restrict the UI to one composer at a time. When you try opening
            // one, we will force close the other one you got
            for (const { id: otherComposerID } of openedAssistants) {
                closeAssistant(otherComposerID);
            }
            openAssistant(composerID, manual);
        }
    };

    const canRunAssistant =
        userSettings.AIAssistantFlags === AI_ASSISTANT_ACCESS.SERVER_ONLY ||
        (hasCompatibleBrowser && hasCompatibleHardware);

    // open assistant by default if it was opened last time
    useEffect(() => {
        if (getIsStickyAssistant(composerID, canShowAssistant, canRunAssistant)) {
            if (userSettings.AIAssistantFlags === AI_ASSISTANT_ACCESS.UNSET) {
                setInnerModal(ComposerInnerModalStates.AssistantSettings);
                return;
            }

            openAssistant(composerID);

            // Start initializing the Assistant when opening it if able to
            if (userSettings.AIAssistantFlags === AI_ASSISTANT_ACCESS.CLIENT_ONLY && !downloadPaused) {
                void initAssistant?.();
            }
        }
    }, []);

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

    useEffect(() => {
        if (uploadInProgress) {
            pauseAutoSave();
        } else {
            restartAutoSave();
        }
    }, [uploadInProgress]);

    const {
        loadingScheduleCount,
        handleScheduleSendModal,
        handleScheduleSend,
        canScheduleSend,
        modal: waitBeforeScheduleModal,
    } = useScheduleSend({
        modelMessage: modelMessage as MessageStateWithData,
        setInnerModal,
        ComposerInnerModal: ComposerInnerModalStates,
        setModelMessage,
        handleSend: handleSend({ sendAsScheduled: true }),
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
    });

    useImperativeHandle(ref, () => ({
        close: handleClose,
    }));

    const handleContentFocus = useCallback(() => {
        addressesBlurRef.current();
        onFocus(); // Events on the main div will not fire because the editor is in an iframe
    }, []);

    const handleInsertGeneratedTextInEditor = (textToInsert: string) => {
        const cleanedText = sanitizeContentToInsert(textToInsert, metadata.isPlainText);
        const needsSeparator = !!removeLineBreaks(getContentBeforeBlockquote());
        const newBody = insertTextBeforeContent(modelMessage, cleanedText, mailSettings, needsSeparator);

        // Update the content in the composer
        handleChangeContent(newBody, true);

        setHasUsedAssistantText(true);
        setSelectedText('');
    };

    // TODO: Execute this method only if assistant is opened
    // Might need a useEffect is user opens on selection but
    // as this method could affect performances, we need to be sure it's only called when needed
    const handleEditorSelection = () => {
        // Need to wait for a processor tick to get Rooster method work efficiently
        setTimeout(() => {
            if (editorRef.current) {
                const selectedText = editorRef.current.getSelectionContent();
                const cleanedText = selectedText ? removeLineBreaks(selectedText).trim() : '';
                setSelectedText(cleanedText);
            }
        }, 0);
    };

    const handleSetEditorSelection = (textToInsert: string) => {
        if (editorRef.current) {
            const cleanedText = sanitizeContentToInsert(textToInsert, metadata.isPlainText);

            editorRef.current.setSelectionContent(cleanedText);
        }
        setSelectedText('');
    };

    const isAssistantExpanded = useMemo(() => {
        return getHasAssistantStatus(openedAssistants, composerID, OpenedAssistantStatus.EXPANDED);
    }, [composerID, openedAssistants]);

    return (
        <div
            className="composer-container flex flex-column flex-1 relative w-full"
            onDragEnter={handleDragEnter}
            data-messagetime={timestamp}
            ref={composerContainerRef}
        >
            <ComposerInnerModals
                innerModal={innerModal}
                message={modelMessage}
                attachmentsFoundKeyword={attachmentsFoundKeyword}
                handleChange={handleChange}
                pendingFiles={pendingFiles}
                handleCloseInnerModal={handleCloseInnerModal}
                handleScheduleSend={handleScheduleSend}
                handleCloseInsertImageModal={handleCloseInsertImageModal}
                handleAddAttachmentsUpload={handleAddAttachmentsUpload}
                handleDelete={handleDelete}
                handleSendAnyway={handleSendAnyway}
                handleCancelSend={handleCancelSend}
                handleToggleAssistant={(aiFlag) => handleToggleAssistant(true, aiFlag)}
                composerID={composerID}
            />
            <div className="composer-blur-container flex flex-column flex-1 max-w-full">
                <div
                    ref={bodyRef}
                    className="composer-body-container flex flex-column flex-nowrap flex-1 max-w-full mt-2"
                >
                    <ComposerMeta
                        addressesBlurRef={addressesBlurRef}
                        addressesFocusRef={addressesFocusRef}
                        composerID={composerID}
                        disabled={opening}
                        message={modelMessage}
                        messageSendInfo={messageSendInfo}
                        onChange={handleChange}
                        onChangeContent={handleChangeContent}
                        onEditExpiration={handleExpiration}
                        ref={composerMetaRef}
                        isInert={isAssistantExpanded}
                    />
                    {isAssistantOpenedInComposer && (
                        <ComposerAssistant
                            assistantID={composerID}
                            getContentBeforeBlockquote={getContentBeforeBlockquote}
                            setContentBeforeBlockquote={setContentBeforeBlockquote}
                            composerSelectedText={selectedText}
                            composerContentRef={composerContentRef}
                            composerContainerRef={composerContainerRef}
                            composerMetaRef={composerMetaRef}
                            setInnerModal={setInnerModal}
                            recipients={getPublicRecipients(modelMessage?.data)}
                            sender={getSender(modelMessage?.data)}
                            onUseGeneratedText={handleInsertGeneratedTextInEditor}
                            onUseRefinedText={handleSetEditorSelection}
                            setAssistantStateRef={setAssistantStateRef}
                        />
                    )}
                    <ComposerContent
                        message={modelMessage}
                        disabled={opening}
                        onEditorReady={handleEditorReady}
                        onChange={handleChange}
                        onChangeContent={handleChangeContent}
                        onFocus={handleContentFocus}
                        onAddAttachments={handleAddAttachmentsStart}
                        onRemoveAttachment={handleRemoveAttachment}
                        onRemoveUpload={handleRemoveUpload}
                        pendingUploads={pendingUploads}
                        mailSettings={mailSettings}
                        userSettings={userSettings}
                        editorMetadata={metadata}
                        ref={composerContentRef}
                        onKeyUp={handleEditorSelection}
                        onMouseUp={handleEditorSelection}
                        isInert={isAssistantExpanded}
                        toolbarCustomRender={(toolbar) =>
                            displayToolbar && toolbarWrapperRef.current
                                ? createPortal(toolbar, toolbarWrapperRef.current)
                                : null
                        }
                    />
                </div>

                {/* Used to display the toolbar below the composer*/}
                {!metadata.isPlainText && (
                    <div
                        ref={toolbarWrapperRef}
                        // @ts-ignore
                        inert={isAssistantExpanded ? '' : undefined}
                    />
                )}

                <ComposerActions
                    composerID={composerID}
                    addressesBlurRef={addressesBlurRef}
                    attachmentTriggerRef={attachmentTriggerRef}
                    className={hasVerticalScroll ? 'composer-actions--has-scroll' : undefined}
                    date={date}
                    editorActionsRef={editorRef}
                    editorMetadata={metadata}
                    loadingScheduleCount={loadingScheduleCount}
                    message={modelMessage}
                    onAddAttachments={handleAddAttachmentsStart}
                    onChange={handleChange}
                    onChangeFlag={handleChangeFlag}
                    onDelete={handleDeleteDraft}
                    onExpiration={handleExpiration}
                    onPassword={handlePassword}
                    onScheduleSendModal={handleScheduleSendModal}
                    onScheduleSend={handleScheduleSend}
                    onSend={handleSend({ sendAsScheduled: false })}
                    opening={opening}
                    syncInProgress={pendingSave.isPending}
                    canScheduleSend={canScheduleSend}
                    showAssistantButton={canShowAssistant}
                    onToggleAssistant={handleToggleAssistant}
                    isInert={isAssistantExpanded}
                    onToggleToolbar={() => setDisplayToolbar(!displayToolbar)}
                    displayToolbar={displayToolbar}
                />
            </div>
            {waitBeforeScheduleModal}
            {senderVerificationModal}
        </div>
    );
};

export default forwardRef(Composer);
