import { useCallback, useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ComposerAgentBar } from '../../features/agents/ComposerAgentBar';
import { AgentPickerModal } from '../../features/agents/AgentPickerModal';
import { ConversationStarters } from '../../features/agents/ConversationStarters';
import { SketchOverlay } from '../../features/drawingcanvas';
import useComposerInput from '../../hooks/useComposerInput';
import { useConversationAgent } from '../../hooks/useConversationAgent';
import type { DriveSDKMethods } from '../../hooks/useDriveSDK';
import { useDriveSDK } from '../../hooks/useDriveSDK';
import type { HandleSendMessage } from '../../hooks/useLumoActions';
import { useDragArea } from '../../providers/DragAreaProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectProvisionalAttachments, selectSpaceById } from '../../redux/selectors';
import { upsertAttachment } from '../../redux/slices/core/attachments';
import type { Attachment, Message } from '../../types';
import { ComposerMode } from '../../types';
import { base64ToFile } from '../../util/imageHelpers';
import { createAttachmentFromPastedContent, getPasteConversionMessage } from '../../util/pastedContentHelper';
import { AttachmentArea } from '../Files';
import GuestDisclaimer from '../Notifications/GuestDisclaimer';
import { GuestNotificationCard } from '../Notifications/GuestNotificationCard';
import { ComposerAttachmentArea } from './ComposerAttachmentArea';
import { ComposerEditorArea } from './ComposerEditorArea';
import { ComposerLimitBanner } from './ComposerLimitBanner';
import { ComposerToolbar } from './ComposerToolbar';
import { useExcelSheetSelection } from './ExcelSheetSelectionModal';
import { useAllRelevantAttachments } from './hooks/useAllRelevantAttachments';
import { useEditorQuery } from './hooks/useEditorQuery';
import { useFileHandling } from './hooks/useFileHandling';
import { useImageGenerationMode } from './hooks/useImageGenerationMode';
import { useNativeComposerFeatureFlagsApi } from './hooks/useNativeComposerFeatureFlagsApi';
import { useNativeComposerFileApi } from './hooks/useNativeComposerFileApi';
import { useNativeComposerLumoStateApi } from './hooks/useNativeComposerLumoStateApi';
import { useNativeComposerVisibilityApi } from './hooks/useNativeComposerVisibilityApi';

import './ComposerComponent.scss';

/**
 * All Drive SDK operations and user identity needed by the inner composer.
 * Only constructed for authenticated users.
 */
type DriveContext = {
    browseFolderChildren: DriveSDKMethods['browseFolderChildren'];
    downloadFile: DriveSDKMethods['downloadFile'];
    uploadFile: DriveSDKMethods['uploadFile'];
    userId?: string;
};

/** Inner props that include optional Drive context for authenticated users */
type ComposerComponentInnerProps = ComposerComponentProps & {
    driveContext?: DriveContext;
};

export type ComposerComponentProps = {
    composerMode: ComposerMode;
    handleSendMessage: HandleSendMessage;
    onAbort?: () => void;
    isGenerating?: boolean;
    isProcessingAttachment: boolean;
    className?: string;
    inputContainerRef?: React.RefObject<HTMLDivElement>;
    setIsEditorFocused?: (isEditorFocused: boolean) => void;
    isEditorFocused?: boolean;
    setIsEditorEmpty?: (isEditorEmpty: boolean) => void;
    messageChain?: Message[]; // Optional for MainContainer (no conversation yet)
    handleOpenFiles?: () => void; // Optional for MainContainer (no files management needed)
    onShowDriveBrowser?: () => void; // Optional for Drive browser functionality
    onOpenFilePreview?: (attachment: Attachment) => void;
    canShowLegalDisclaimer?: boolean;
    initialQuery?: string; // Initial query to populate and auto-execute
    prefillQuery?: string; // Query to prefill without auto-executing
    spaceId?: string; // Optional space ID to include space-level attachments
    autoOpenSketch?: boolean; // Auto-open the sketch canvas on mount
    canShowLumoUpsellToggle?: boolean;
    canShowGuestNotificationCard?: boolean;
    placeholder?: string;
    optionalElementBelowComposer?: React.ReactNode;
    /** Minimal agent surface: hides image creation, sketch and Drive upload from the composer. */
    isAgent?: boolean;
};

/**
 * Inner component that handles the actual composer logic.
 * Receives an optional driveContext — has no direct knowledge of guest vs authenticated state.
 */
const ComposerComponentInner = ({
    composerMode,
    handleSendMessage,
    onAbort,
    isGenerating,
    isProcessingAttachment,
    className,
    inputContainerRef,
    setIsEditorFocused,
    isEditorFocused,
    setIsEditorEmpty,
    messageChain = [],
    handleOpenFiles,
    onShowDriveBrowser,
    onOpenFilePreview,
    canShowLegalDisclaimer,
    initialQuery,
    prefillQuery,
    spaceId,
    autoOpenSketch,
    placeholder,
    canShowGuestNotificationCard = false,
    optionalElementBelowComposer,
    isAgent = false,
    driveContext,
}: ComposerComponentInnerProps) => {
    const { isDragging: isDraggingOverScreen } = useDragArea();
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { isWebSearchButtonToggled } = useWebSearch();
    const hasAttachments = provisionalAttachments.length > 0;
    const composerContainerRef = useRef<HTMLElement | null>(null);
    const [showDrawingModal, setShowDrawingModal] = useState(false);
    const [pendingSketchDescription, setPendingSketchDescription] = useState<string | null>(null);
    const {
        requestSheetSelection: handleSelectExcelSheets,
        modal: excelSheetSelectionModal,
        isOpen: isSheetModalOpen,
    } = useExcelSheetSelection();
    const { isGhostChatMode } = useGhostChat();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const isGuest = useIsGuest();

    const { selectedAspectRatio, handleAspectRatioChange, isCreateImageMode, setIsCreateImageMode, getAspectRatio } =
        useImageGenerationMode();

    const isImageGenerationMode = composerMode === ComposerMode.GALLERY || isCreateImageMode;

    // Agents are hidden inside projects: a project already injects its own instructions,
    // so layering an agent persona on top would be redundant and confusing.
    const composerSpace = useLumoSelector(selectSpaceById(spaceId ?? ''));
    const canUseAgents = !isGuest && !composerSpace?.isProject;

    // Conversation starters for the active agent, surfaced on a fresh, empty conversation.
    const { activeAgent } = useConversationAgent(messageChain?.[0]?.conversationId);
    const agentStarters = activeAgent?.conversationStarters ?? [];

    const allRelevantAttachments = useAllRelevantAttachments(messageChain, provisionalAttachments, spaceId);

    const {
        handleFileProcessing,
        handleFilesSelected,
        handleBrowseDrive,
        handleDeleteAttachment,
        handleFilesFromNative,
        fileUploadMode,
    } = useFileHandling({
        messageChain,
        onShowDriveBrowser,
        spaceId,
        uploadToDrive: driveContext?.uploadFile,
        onSelectExcelSheets: handleSelectExcelSheets,
    });

    const handleDrawSketch = useCallback(() => {
        setShowDrawingModal(true);
    }, []);

    // Auto-open sketch canvas when navigated from gallery with ?sketch=1
    useEffect(() => {
        if (autoOpenSketch) {
            setShowDrawingModal(true);
        }
    }, [autoOpenSketch]);

    const nativeComposerVisibilityApi = useNativeComposerVisibilityApi({
        showDrawingModal,
        showFileModal: isSheetModalOpen,
    });
    useNativeComposerFeatureFlagsApi();

    // registers a hook that updates the native composer state
    useNativeComposerFileApi(
        composerMode,
        hasAttachments,
        messageChain && messageChain.length !== 0,
        handleFilesFromNative,
        handleBrowseDrive,
        handleDrawSketch,
        handleDeleteAttachment
    );

    const handleDrawingExport = useCallback(
        async (imageData: string, _mode: string, description: string) => {
            const file = base64ToFile(imageData, `sketch-${Date.now()}.png`);
            await handleFileProcessing(file);
            setPendingSketchDescription(description.trim());
        },
        [handleFileProcessing]
    );

    const isAutocompleteActiveRef = useRef(false);

    const handleFocus = useCallback(() => {
        setIsEditorFocused?.(true);
    }, [setIsEditorFocused]);

    const handleBlur = useCallback(() => {
        setIsEditorFocused?.(false);
    }, [setIsEditorFocused]);

    const handlePasteLargeContent = useCallback(
        (pastedContent: string) => {
            const attachment = createAttachmentFromPastedContent(pastedContent);
            dispatch(upsertAttachment(attachment));
            const lineCount = pastedContent.split('\n').length;
            const charCount = pastedContent.length;
            const message = getPasteConversionMessage(lineCount, charCount);
            createNotification({ text: message, type: 'info' });
        },
        [dispatch, createNotification]
    );

    const sendGenerateMessage = useCallback(
        async (value: string) => {
            if (isProcessingAttachment) {
                console.log('Submission blocked: files are still being processed');
                return;
            }
            if (!value.trim()) {
                return;
            }
            composerInput.clear();
            const imageOptions = isImageGenerationMode ? { aspectRatio: getAspectRatio() } : undefined;
            await handleSendMessage(value, isWebSearchButtonToggled, imageOptions);
        },
        // composerInput.clear is intentionally omitted from deps — it's stable but the object is created below
        // getAspectRatio is stable (useCallback with no deps), intentionally omitted
        [handleSendMessage, isWebSearchButtonToggled, isProcessingAttachment, isImageGenerationMode]
    );

    const composerInput = useComposerInput({
        onSubmitCallback: sendGenerateMessage,
        isGenerating,
        isProcessingAttachment,
        isAutocompleteActiveRef,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onPasteLargeContent: handlePasteLargeContent,
    });

    const { isEmpty, clear, textareaRef, setValue, handleSubmit } = composerInput;

    const sendIsDisabled = !(isGenerating ?? false) && (isEmpty || isProcessingAttachment);
    const canShowSendButton = (isGenerating ?? false) || !isEmpty;

    // Update parent component when empty state changes
    useEffect(() => {
        setIsEditorEmpty?.(isEmpty);
    }, [isEmpty, setIsEditorEmpty]);

    // Populate textarea with query once per unique value
    const handleInitialQueryReady = useCallback(async () => {
        const currentValue = textareaRef.current?.value ?? '';
        if (!currentValue.trim()) return;
        clear();
        await handleSendMessage(currentValue, isWebSearchButtonToggled);
    }, [textareaRef, clear, handleSendMessage, isWebSearchButtonToggled]);

    useEditorQuery(initialQuery, textareaRef, setValue, isProcessingAttachment, handleInitialQueryReady);
    useEditorQuery(prefillQuery, textareaRef, setValue, isProcessingAttachment);

    // Handle paste events to attach images from clipboard
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (!e.clipboardData?.items) return;
            const imageItems = Array.from(e.clipboardData.items).filter((item) => item.type.startsWith('image/'));
            if (imageItems.length === 0) return;
            e.preventDefault();
            for (const item of imageItems) {
                const file = item.getAsFile();
                if (file) await handleFileProcessing(file);
            }
        };

        const container = composerContainerRef.current;
        if (container) {
            container.addEventListener('paste', handlePaste);
            return () => container.removeEventListener('paste', handlePaste);
        }
    }, [handleFileProcessing]);

    // Auto-submit after sketch export: set description as textarea content and send
    useEffect(() => {
        if (pendingSketchDescription === null || isProcessingAttachment) return;

        if (pendingSketchDescription) {
            setValue(pendingSketchDescription);
        }

        const timer = setTimeout(() => {
            if (pendingSketchDescription) {
                void sendGenerateMessage(pendingSketchDescription);
            }
            setPendingSketchDescription(null);
        }, 100);

        return () => clearTimeout(timer);
    }, [pendingSketchDescription, isProcessingAttachment, setValue, sendGenerateMessage]);

    const showLegalDisclaimer = canShowLegalDisclaimer && !isEditorFocused && isEmpty;

    useNativeComposerLumoStateApi(isGenerating);

    return (
        <>
            {isGuest && canShowGuestNotificationCard && (
                <GuestNotificationCard messageChain={messageChain} isGenerating={isGenerating} />
            )}
            <div
                style={{ visibility: nativeComposerVisibilityApi.showWebComposer() ? 'visible' : 'hidden' }}
                className="w-full"
                ref={inputContainerRef}
            >
                <section
                    ref={composerContainerRef}
                    className={clsx(
                        'flex flex-column flex-nowrap min-h-custom items-center gap-2',
                        className,
                        isGhostChatMode && 'ghost-mode'
                    )}
                    style={{ '--min-h-custom': '4.375rem' /* 70px */ }}
                    aria-label={c('collider_2025: Info').t`Ask anything to ${LUMO_SHORT_APP_NAME}`}
                >
                    <h2 className="sr-only">{c('collider_2025: Info').t`Ask anything to ${LUMO_SHORT_APP_NAME}`}</h2>

                    {showLegalDisclaimer && <GuestDisclaimer />}

                    <ComposerLimitBanner
                        conversationId={messageChain?.[0]?.conversationId}
                        spaceId={spaceId}
                        onOpenFiles={handleOpenFiles}
                    />

                    {composerMode === ComposerMode.NEW_CONVERSATION && isEmpty && agentStarters.length > 0 && (
                        <ConversationStarters
                            starters={agentStarters}
                            onSelect={(text) => {
                                void sendGenerateMessage(text);
                            }}
                            className="justify-center mb-1"
                        />
                    )}

                    <div
                        className={clsx(
                            'lumo-input-container bg-norm border border-norm  w-full',
                            isGhostChatMode && 'ghost-mode',
                            composerMode === ComposerMode.NEW_CONVERSATION && '--glowing-composer'
                        )}
                    >
                        {canUseAgents && <ComposerAgentBar conversationId={messageChain?.[0]?.conversationId} />}
                        {hasAttachments && (
                            <ComposerAttachmentArea
                                provisionalAttachments={provisionalAttachments}
                                allRelevantAttachments={allRelevantAttachments}
                                messageChain={messageChain}
                                onDeleteAttachment={handleDeleteAttachment}
                                onViewFile={onOpenFilePreview ?? (() => {})}
                                onOpenFiles={handleOpenFiles}
                            />
                        )}
                        <ComposerEditorArea
                            composerInput={composerInput}
                            canShowSendButton={canShowSendButton}
                            sendIsDisabled={sendIsDisabled}
                            isGenerating={isGenerating ?? false}
                            isProcessingAttachment={isProcessingAttachment}
                            onAbort={onAbort}
                            onSubmit={handleSubmit}
                            spaceId={spaceId}
                            messageChain={messageChain}
                            isAutocompleteActiveRef={isAutocompleteActiveRef}
                            browseFolderChildren={driveContext?.browseFolderChildren}
                            downloadFile={driveContext?.downloadFile}
                            userId={driveContext?.userId}
                            placeholder={placeholder}
                        />
                        <ComposerToolbar
                            composerMode={composerMode}
                            onFilesSelected={handleFilesSelected}
                            onBrowseDrive={handleBrowseDrive}
                            onDrawSketch={handleDrawSketch}
                            fileUploadMode={fileUploadMode}
                            selectedAspectRatio={selectedAspectRatio}
                            onAspectRatioChange={handleAspectRatioChange}
                            isCreateImageMode={isCreateImageMode}
                            onCreateImageModeChange={setIsCreateImageMode}
                            canUseAgents={canUseAgents}
                            isAgent={isAgent}
                        />
                    </div>
                    {optionalElementBelowComposer}
                    {isGuest && (
                        <TermsAndConditions className={clsx('m-0', isAgent ? 'text-center' : 'hidden md:block')} />
                    )}
                </section>

                {isDraggingOverScreen && <AttachmentArea handleFileProcessing={handleFileProcessing} />}
            </div>

            <SketchOverlay
                isOpen={showDrawingModal}
                onClose={() => setShowDrawingModal(false)}
                onExport={handleDrawingExport}
                mode="blank"
            />
            {canUseAgents && <AgentPickerModal conversationId={messageChain?.[0]?.conversationId} />}
            {excelSheetSelectionModal}
        </>
    );
};

/**
 * Wrapper for authenticated users. Calls useDriveSDK once for all operations
 * and assembles a DriveContext object passed to the inner component.
 */
const ComposerComponentWithDrive = (props: ComposerComponentProps) => {
    const { browseFolderChildren, downloadFile, uploadFile } = useDriveSDK();
    const [user] = useUser();

    const driveContext: DriveContext = {
        browseFolderChildren,
        downloadFile,
        uploadFile,
        userId: user?.ID,
    };

    return <ComposerComponentInner {...props} driveContext={driveContext} />;
};

/**
 * Main exported component. isGuest is read exactly once here to decide which
 * wrapper renders — ComposerComponentInner has no awareness of guest vs authenticated.
 */
export const ComposerComponent = (props: ComposerComponentProps) => {
    const isGuest = useIsGuest();
    return isGuest ? <ComposerComponentInner {...props} /> : <ComposerComponentWithDrive {...props} />;
};
