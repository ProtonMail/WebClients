import {
    DragEvent,
    Ref,
    RefObject,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import { c } from 'ttag';

import { useAddresses, useHandler, useSubscribeEventManager, useUserSettings } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { clearBit, setBit } from '@proton/shared/lib/helpers/bitset';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import ComposerAssistant from 'proton-mail/genie/ComposerAssistant';
import { useAssistant } from 'proton-mail/genie/useAssistant';
import { cleanAssistantEmailGeneration, insertTextBeforeBlockquotes } from 'proton-mail/helpers/message/messageContent';
import useMailModel from 'proton-mail/hooks/useMailModel';

import { DRAG_ADDRESS_KEY } from '../../constants';
import { EditorTypes, useComposerContent } from '../../hooks/composer/useComposerContent';
import { ComposerInnerModalStates } from '../../hooks/composer/useComposerInnerModals';
import { useScheduleSend } from '../../hooks/composer/useScheduleSend';
import { useHasScroll } from '../../hooks/useHasScroll';
import { Event } from '../../models/event';
import { MessageState, MessageStateWithData, PartialMessageState } from '../../store/messages/messagesTypes';
import ComposerContent from './ComposerContent';
import ComposerMeta from './ComposerMeta';
import ComposerActions from './actions/ComposerActions/ComposerActions';
import { ExternalEditorActions } from './editor/EditorWrapper';
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
    const mailSettings = useMailModel('MailSettings');
    const [userSettings] = useUserSettings();
    const [addresses = []] = useAddresses();

    const bodyRef = useRef<HTMLDivElement>(null);
    const [hasVerticalScroll] = useHasScroll(bodyRef);

    // onClose handler can be called in an async handler
    // Input onClose ref can change in the meantime
    const onClose = useHandler(inputOnClose);

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

    const { initAssistant, openedAssistants, openAssistant, closeAssistant, hasAccessToAssistant, canRunAssistant } =
        useAssistant();

    const showAssistantButton = hasAccessToAssistant && canRunAssistant;

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

        showAssistant,
        setShowAssistant,
        toggleAssistant,
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

    const handleToggleAssistant = () => {
        toggleAssistant();
        const isAssistantOpenedInComposer = openedAssistants.includes(composerID);
        if (isAssistantOpenedInComposer) {
            closeAssistant(composerID);
        } else {
            openAssistant(composerID);
        }
    };

    const handleInsertGeneratedTextInEditor = (textToInsert: string) => {
        const newBody = insertTextBeforeBlockquotes(textToInsert, modelMessage, mailSettings, userSettings, addresses);

        // Update the content in the composer
        handleChangeContent(newBody, true);
    };

    return (
        <div
            className="composer-container flex flex-column flex-1 relative w-full"
            onDragEnter={handleDragEnter}
            data-messagetime={timestamp}
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
            />
            <div className="composer-blur-container flex flex-column flex-1 max-w-full">
                {showAssistant && (
                    <ComposerAssistant
                        onUseGeneratedText={handleInsertGeneratedTextInEditor}
                        onUpdateShowAssistant={(value: boolean) => setShowAssistant(value)}
                        assistantID={composerID}
                        onCleanGeneration={cleanAssistantEmailGeneration}
                    />
                )}
                <div
                    ref={bodyRef}
                    className="composer-body-container flex flex-column flex-nowrap flex-1 max-w-full mt-2"
                >
                    <ComposerMeta
                        composerID={composerID}
                        message={modelMessage}
                        messageSendInfo={messageSendInfo}
                        disabled={opening}
                        onChange={handleChange}
                        onChangeContent={handleChangeContent}
                        addressesBlurRef={addressesBlurRef}
                        addressesFocusRef={addressesFocusRef}
                        onEditExpiration={handleExpiration}
                    />
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
                        editorMetadata={metadata}
                    />
                </div>
                <ComposerActions
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
                    showAssistantButton={showAssistantButton}
                    disableAssistant={openedAssistants.length > 0} // TODO remove this after alpha
                    onToggleAssistant={handleToggleAssistant}
                    initAssistant={initAssistant}
                />
            </div>
            {waitBeforeScheduleModal}
            {senderVerificationModal}
        </div>
    );
};

export default forwardRef(Composer);
