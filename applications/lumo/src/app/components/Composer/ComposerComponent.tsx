import { useCallback, useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { SketchOverlay } from '../../features/drawingcanvas';
import type { DriveSDKMethods } from '../../hooks/useDriveSDK';
import { useDriveSDK } from '../../hooks/useDriveSDK';
import type { HandleSendMessage } from '../../hooks/useLumoActions';
import { useTierErrors } from '../../hooks/useTierErrors';
import useTipTapEditor from '../../hooks/useTipTapEditor';
import { useDragArea } from '../../providers/DragAreaProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectProvisionalAttachments } from '../../redux/selectors';
import { upsertAttachment } from '../../redux/slices/core/attachments';
import type { Attachment, Message } from '../../types';
import { base64ToFile } from '../../util/imageHelpers';
import { createAttachmentFromPastedContent, getPasteConversionMessage } from '../../util/pastedContentHelper';
import { AttachmentArea, FileContentModal } from '../Files';
import GuestDisclaimer from '../Notifications/GuestDisclaimer';
import { ComposerAttachmentArea } from './ComposerAttachmentArea';
import { ComposerEditorArea } from './ComposerEditorArea';
import { ComposerToolbar } from './ComposerToolbar';
import { useAllRelevantAttachments } from './hooks/useAllRelevantAttachments';
import { useEditorQuery } from './hooks/useEditorQuery';
import { useFileHandling } from './hooks/useFileHandling';

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
    canShowLegalDisclaimer?: boolean;
    canShowLumoUpsellToggle?: boolean;
    initialQuery?: string; // Initial query to populate and auto-execute
    prefillQuery?: string; // Query to prefill without auto-executing
    spaceId?: string; // Optional space ID to include space-level attachments
};

/**
 * Inner component that handles the actual composer logic.
 * Receives an optional driveContext — has no direct knowledge of guest vs authenticated state.
 */
const ComposerComponentInner = ({
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
    canShowLegalDisclaimer,
    canShowLumoUpsellToggle,
    initialQuery,
    prefillQuery,
    spaceId,
    driveContext,
}: ComposerComponentInnerProps) => {
    const { isDragging: isDraggingOverScreen } = useDragArea();
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { hasTierErrors } = useTierErrors();
    const { isWebSearchButtonToggled } = useWebSearch();
    const hasAttachments = provisionalAttachments.length > 0;
    const composerContainerRef = useRef<HTMLElement | null>(null);
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const [showDrawingModal, setShowDrawingModal] = useState(false);
    const { isGhostChatMode } = useGhostChat();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();

    const allRelevantAttachments = useAllRelevantAttachments(messageChain, provisionalAttachments, spaceId);

    const { handleFileProcessing, handleFilesSelected, handleBrowseDrive, handleDeleteAttachment, fileUploadMode } =
        useFileHandling({ messageChain, onShowDriveBrowser, spaceId, uploadToDrive: driveContext?.uploadFile });

    const sendGenerateMessage = useCallback(
        async (editor: any) => {
            if (isProcessingAttachment) {
                console.log('Submission blocked: files are still being processed');
                return;
            }

            if (!editor?.isEmpty) {
                const markdown = editor?.storage.markdown.getMarkdown();
                if (!markdown) return;
                editor?.commands.clearContent();
                await handleSendMessage(markdown, isWebSearchButtonToggled);
            }
        },
        [handleSendMessage, isWebSearchButtonToggled, isProcessingAttachment]
    );

    const handleDrawSketch = useCallback(() => {
        setShowDrawingModal(true);
    }, []);

    const handleDrawingExport = useCallback(
        async (imageData: string) => {
            const file = base64ToFile(imageData, `sketch-${Date.now()}.png`);
            await handleFileProcessing(file);
            createNotification({
                text: c('collider_2025: Info').t`Sketch added as attachment`,
                type: 'success',
            });
        },
        [handleFileProcessing, createNotification]
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

    const { editor, handleSubmit } = useTipTapEditor({
        onSubmitCallback: sendGenerateMessage,
        hasTierErrors,
        isGenerating,
        isProcessingAttachment,
        isAutocompleteActiveRef: isAutocompleteActiveRef,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onPasteLargeContent: handlePasteLargeContent,
    });

    const isEditorEmpty = editor?.isEmpty;
    const sendIsDisabled = !(isGenerating ?? false) && (isEditorEmpty || isProcessingAttachment);
    const canShowSendButton = (isGenerating ?? false) || !isEditorEmpty;

    // Update parent component when editor empty state changes
    useEffect(() => {
        setIsEditorEmpty?.(isEditorEmpty ?? true);
    }, [isEditorEmpty, setIsEditorEmpty]);

    // Populate editor with query once per unique value; auto-submit when onReady is provided
    useEditorQuery(initialQuery, editor, isProcessingAttachment, sendGenerateMessage);
    useEditorQuery(prefillQuery, editor, isProcessingAttachment);

    const showLegalDisclaimer = canShowLegalDisclaimer && !isEditorFocused && isEditorEmpty;

    return (
        <>
            <div className="w-full" ref={inputContainerRef}>
                <section
                    ref={composerContainerRef}
                    className={clsx(
                        'flex flex-column flex-nowrap min-h-custom items-center gap-1',
                        className,
                        isGhostChatMode && 'ghost-mode'
                    )}
                    style={{ '--min-h-custom': '4.375rem' /* 70px */ }}
                    aria-label={c('collider_2025: Info').t`Ask anything to ${LUMO_SHORT_APP_NAME}`}
                >
                    <h2 className="sr-only">{c('collider_2025: Info').t`Ask anything to ${LUMO_SHORT_APP_NAME}`}</h2>

                    {showLegalDisclaimer && <GuestDisclaimer />}

                    <div
                        className={clsx(
                            'lumo-input-container shadow-lifted-composer bg-weak w-full',
                            isGhostChatMode && 'ghost-mode'
                        )}
                    >
                        {hasAttachments && (
                            <ComposerAttachmentArea
                                provisionalAttachments={provisionalAttachments}
                                allRelevantAttachments={allRelevantAttachments}
                                messageChain={messageChain}
                                onDeleteAttachment={handleDeleteAttachment}
                                onViewFile={setFileToView}
                                onOpenFiles={handleOpenFiles}
                            />
                        )}
                        <ComposerEditorArea
                            editor={editor}
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
                        />
                        <ComposerToolbar
                            onFilesSelected={handleFilesSelected}
                            onBrowseDrive={handleBrowseDrive}
                            onDrawSketch={handleDrawSketch}
                            hasAttachments={hasAttachments}
                            canShowLumoUpsellToggle={canShowLumoUpsellToggle}
                            fileUploadMode={fileUploadMode}
                        />
                    </div>
                </section>

                {/* drop files area, hidden unless one drags a file */}
                {isDraggingOverScreen && <AttachmentArea handleFileProcessing={handleFileProcessing} />}
            </div>

            {fileToView && (
                <FileContentModal attachment={fileToView} onClose={() => setFileToView(null)} open={!!fileToView} />
            )}

            <SketchOverlay
                isOpen={showDrawingModal}
                onClose={() => setShowDrawingModal(false)}
                onExport={handleDrawingExport}
                mode="blank"
            />
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
