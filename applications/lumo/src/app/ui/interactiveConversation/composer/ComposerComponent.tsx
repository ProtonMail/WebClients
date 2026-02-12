import { useCallback, useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useDriveSDK } from '../../../hooks/useDriveSDK';
import type { HandleSendMessage } from '../../../hooks/useLumoActions';
import { useTierErrors } from '../../../hooks/useTierErrors';
import useTipTapEditor from '../../../hooks/useTipTapEditor';
import { useDragArea } from '../../../providers/DragAreaProvider';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useWebSearch } from '../../../providers/WebSearchProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectProvisionalAttachments, selectSpaceByIdOptional } from '../../../redux/selectors';
import { upsertAttachment } from '../../../redux/slices/core/attachments';
import type { Attachment, Message, ProjectSpace } from '../../../types';
import { createAttachmentFromPastedContent, getPasteConversionMessage } from '../../../util/pastedContentHelper';
import { sendVoiceEntryClickEvent } from '../../../util/telemetry';
import { AttachmentArea, FileContentModal } from '../../components/Files';
import GuestDisclaimer from '../../components/GuestDisclaimer';
import { SketchOverlay } from '../../features/drawingcanvas';
import { ComposerAttachmentArea } from './ComposerAttachmentArea';
import { ComposerEditorArea, type ComposerEditorAreaProps } from './ComposerEditorArea';
import { ComposerToolbar } from './ComposerToolbar';
import { useAllRelevantAttachments } from './hooks/useAllRelevantAttachments';
import { useFileHandling } from './hooks/useFileHandling';

import './ComposerComponent.scss';

/**
 * Wrapper component that provides Drive SDK functions to ComposerEditorArea.
 * This is a separate component so we can conditionally render it only for authenticated users.
 */
const ComposerEditorAreaWithDrive = (
    props: Omit<ComposerEditorAreaProps, 'browseFolderChildren' | 'downloadFile' | 'userId'>
) => {
    const { browseFolderChildren, downloadFile } = useDriveSDK();
    const [user] = useUser();

    return (
        <ComposerEditorArea
            {...props}
            browseFolderChildren={browseFolderChildren}
            downloadFile={downloadFile}
            userId={user?.ID}
        />
    );
};

/** Inner props that include the optional Drive upload function */
type ComposerComponentInnerProps = ComposerComponentProps & {
    uploadToDrive?: (folderId: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
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
 * Receives optional uploadToDrive from wrapper.
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
    messageChain = [], // Default to empty array for MainContainer
    handleOpenFiles,
    onShowDriveBrowser,
    canShowLegalDisclaimer,
    canShowLumoUpsellToggle,
    initialQuery,
    prefillQuery,
    spaceId,
    uploadToDrive,
}: ComposerComponentInnerProps) => {
    const { isDragging: isDraggingOverScreen } = useDragArea();
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { hasTierErrors } = useTierErrors();
    const { isWebSearchButtonToggled } = useWebSearch();
    const isGuest = useIsGuest();
    const hasAttachments = provisionalAttachments.length > 0;
    const composerContainerRef = useRef<HTMLElement | null>(null);
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [showDrawingModal, setShowDrawingModal] = useState(false);
    const { isGhostChatMode } = useGhostChat();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();

    // Get space to check for linked Drive folder (hides "Add from Drive" option when folder is linked)
    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const linkedDriveFolder = (space as ProjectSpace | undefined)?.linkedDriveFolder;

    // Get all relevant attachments for context calculations (includes space-level attachments if spaceId is provided)
    const allRelevantAttachments = useAllRelevantAttachments(messageChain, provisionalAttachments, spaceId);

    // File handling hook - pass uploadToDrive only for authenticated users
    const {
        fileInputRef,
        handleFileProcessing,
        handleFileInputChange,
        handleOpenFileDialog,
        handleBrowseDrive,
        handleDeleteAttachment,
    } = useFileHandling({ messageChain, onShowDriveBrowser, spaceId, linkedDriveFolder, uploadToDrive });

    const sendGenerateMessage = useCallback(
        async (editor: any) => {
            // Block submission if files are still processing
            if (isProcessingAttachment) {
                console.log('Submission blocked: files are still being processed');
                return;
            }

            if (!editor?.isEmpty) {
                // Get content as markdown
                const markdown = editor?.storage.markdown.getMarkdown();

                if (!markdown) {
                    return;
                }
                editor?.commands.clearContent();
                await handleSendMessage(markdown, isWebSearchButtonToggled);
            }
        },
        [handleSendMessage, isWebSearchButtonToggled, isProcessingAttachment]
    );

    const handleUploadButtonClick = useCallback(() => {
        setShowUploadMenu(!showUploadMenu);
    }, [showUploadMenu]);

    const handleDrawSketch = useCallback(() => {
        setShowDrawingModal(true);
    }, []);

    const handleDrawingExport = useCallback(
        async (imageData: string) => {
            // Convert base64 to File
            const base64Data = imageData.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const file = new File([blob], `sketch-${Date.now()}.png`, { type: 'image/png' });

            // Process the file as an attachment
            await handleFileProcessing(file);

            createNotification({
                text: c('collider_2025: Info').t`Sketch added as attachment`,
                type: 'success',
            });
        },
        [handleFileProcessing, createNotification]
    );

    // Add click event listener for voice entry click telemetry (on mobile)
    useEffect(() => {
        const voiceButton = document.getElementById('voice-entry-mobile');

        const handleVoiceEntryClick = () => {
            sendVoiceEntryClickEvent();
        };

        if (voiceButton && !voiceButton.classList.contains('hidden')) {
            voiceButton.addEventListener('click', handleVoiceEntryClick);

            return () => {
                voiceButton.removeEventListener('click', handleVoiceEntryClick);
            };
        }
    }, []);

    // Use a ref instead of state to avoid infinite loops
    // useTipTapEditor reads this via a ref internally, so we can pass a ref directly
    const isAutocompleteActiveRef = useRef(false);
    const handleFocus = useCallback(() => {
        setIsEditorFocused?.(true);
    }, [setIsEditorFocused]);

    const handleBlur = useCallback(() => {
        setIsEditorFocused?.(false);
    }, [setIsEditorFocused]);

    const handlePasteLargeContent = useCallback(
        (pastedContent: string) => {
            // Create attachment from pasted content
            const attachment = createAttachmentFromPastedContent(pastedContent);

            // Add to Redux as provisional attachment
            dispatch(upsertAttachment(attachment));

            // Show notification to user
            const lineCount = pastedContent.split('\n').length;
            const charCount = pastedContent.length;
            const message = getPasteConversionMessage(lineCount, charCount);

            createNotification({
                text: message,
                type: 'info',
            });

            // Don't insert anything in the editor - let the user type their own message
            // The attachment will be included automatically as a provisional attachment
        },
        [dispatch, createNotification]
    );

    // Handle paste events to attach images from clipboard
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            // Only process if there are clipboard items
            if (!e.clipboardData?.items) return;

            // Check if any item is an image
            const items = Array.from(e.clipboardData.items);
            const imageItems = items.filter((item) => item.type.startsWith('image/'));

            if (imageItems.length === 0) return;

            // Prevent default paste behavior for images
            e.preventDefault();

            // Process each image
            for (const item of imageItems) {
                const file = item.getAsFile();
                if (file) {
                    await handleFileProcessing(file);
                }
            }
        };

        const container = composerContainerRef.current;
        if (container) {
            container.addEventListener('paste', handlePaste);
            return () => {
                container.removeEventListener('paste', handlePaste);
            };
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

    // Handle initial query from URL parameter (auto-execute)
    const hasExecutedInitialQuery = useRef(false);
    const lastExecutedQuery = useRef<string | null>(null);

    useEffect(() => {
        // Reset execution flag if initialQuery changes to a new value
        if (initialQuery !== lastExecutedQuery.current) {
            hasExecutedInitialQuery.current = false;
            lastExecutedQuery.current = initialQuery || null;
        }

        if (initialQuery && editor && !hasExecutedInitialQuery.current && !isProcessingAttachment) {
            // Set the content in the editor
            editor.commands.setContent(initialQuery);

            // Mark as executed to prevent re-execution
            hasExecutedInitialQuery.current = true;

            // Wait a tick for the editor to update, then submit
            setTimeout(() => {
                void sendGenerateMessage(editor);
            }, 100);
        }
    }, [initialQuery, editor, isProcessingAttachment, sendGenerateMessage]);

    // Handle prefill query (just populate, don't auto-execute)
    const hasExecutedPrefillQuery = useRef(false);
    const lastPrefillQuery = useRef<string | null>(null);

    useEffect(() => {
        // Reset execution flag if prefillQuery changes to a new value
        if (prefillQuery !== lastPrefillQuery.current) {
            hasExecutedPrefillQuery.current = false;
            lastPrefillQuery.current = prefillQuery || null;
        }

        if (prefillQuery && editor && !hasExecutedPrefillQuery.current && !isProcessingAttachment) {
            // Set the content in the editor without submitting
            editor.commands.setContent(prefillQuery);
            editor.commands.focus('end');

            // Mark as executed to prevent re-execution
            hasExecutedPrefillQuery.current = true;
        }
    }, [prefillQuery, editor, isProcessingAttachment]);

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

                    {/* Legal disclaimer - only shown in guest mode on mobile when editor is focused */}
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
                        {isGuest ? (
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
                            />
                        ) : (
                            <ComposerEditorAreaWithDrive
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
                            />
                        )}
                        <ComposerToolbar
                            fileInputRef={fileInputRef}
                            handleFileInputChange={handleFileInputChange}
                            handleOpenFileDialog={handleOpenFileDialog}
                            handleBrowseDrive={handleBrowseDrive}
                            handleDrawSketch={handleDrawSketch}
                            showUploadMenu={showUploadMenu}
                            setShowUploadMenu={setShowUploadMenu}
                            handleUploadButtonClick={handleUploadButtonClick}
                            hasAttachments={hasAttachments}
                            canShowLumoUpsellToggle={canShowLumoUpsellToggle}
                            hideDriveOption={!!linkedDriveFolder}
                            uploadsToDrive={!!linkedDriveFolder}
                        />
                    </div>
                </section>

                {/* drop files area, hidden unless one drags a file */}
                {isDraggingOverScreen && (
                    // DragAreaProvider is already outside of InteractiveConversationComponent
                    // <DragAreaProvider>
                    <AttachmentArea handleFileProcessing={handleFileProcessing} />
                    // </DragAreaProvider>
                )}
            </div>

            {/* File Content Modal */}
            {fileToView && (
                <FileContentModal attachment={fileToView} onClose={() => setFileToView(null)} open={!!fileToView} />
            )}

            {/* Drawing Canvas Overlay */}
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
 * Wrapper component that provides Drive SDK upload function for authenticated users.
 * For guest users, uploadToDrive is not provided.
 */
const ComposerComponentWithDrive = (props: ComposerComponentProps) => {
    const { uploadFile } = useDriveSDK();
    return <ComposerComponentInner {...props} uploadToDrive={uploadFile} />;
};

/**
 * Main exported component that conditionally uses Drive SDK based on guest status.
 */
export const ComposerComponent = (props: ComposerComponentProps) => {
    const isGuest = useIsGuest();

    // For guest users, render without Drive SDK (avoids useUser() error)
    if (isGuest) {
        return <ComposerComponentInner {...props} />;
    }

    // For authenticated users, provide Drive SDK upload function
    return <ComposerComponentWithDrive {...props} />;
};
