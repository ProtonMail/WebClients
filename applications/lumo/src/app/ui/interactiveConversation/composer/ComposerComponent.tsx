import { useCallback, useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { HandleSendMessage } from '../../../hooks/useLumoActions';
import { useTierErrors } from '../../../hooks/useTierErrors';
import useTipTapEditor from '../../../hooks/useTipTapEditor';
import { useDragArea } from '../../../providers/DragAreaProvider';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import { useLumoSelector } from '../../../redux/hooks';
import { selectProvisionalAttachments } from '../../../redux/selectors';
import type { Attachment, Message } from '../../../types';
import { sendVoiceEntryClickEvent, sendWebSearchButtonToggledEvent } from '../../../util/telemetry';
import { AttachmentArea, FileContentModal } from '../../components/Files';
import GuestDisclaimer from '../../components/GuestDisclaimer';
import { ComposerAttachmentArea } from './ComposerAttachmentArea';
import { ComposerEditorArea } from './ComposerEditorArea';
import { ComposerToolbar } from './ComposerToolbar';
import { useAllRelevantAttachments } from './hooks/useAllRelevantAttachments';
import { useFileHandling } from './hooks/useFileHandling';

import './ComposerComponent.scss';

export type ComposerComponentProps = {
    handleSendMessage: HandleSendMessage;
    onAbort?: () => void;
    isGenerating?: boolean;
    isProcessingAttachment: boolean;
    className?: string;
    inputContainerRef?: React.RefObject<HTMLDivElement>;
    isWebSearchButtonToggled: boolean;
    onToggleWebSearch: () => void;
    setIsEditorFocused?: (isEditorFocused: boolean) => void;
    isEditorFocused?: boolean;
    setIsEditorEmpty?: (isEditorEmpty: boolean) => void;
    messageChain?: Message[]; // Optional for MainContainer (no conversation yet)
    handleOpenFiles?: () => void; // Optional for MainContainer (no files management needed)
    onShowDriveBrowser?: () => void; // Optional for Drive browser functionality
    isGuest?: boolean; // For showing disclaimer in guest mode
    isSmallScreen?: boolean; // For mobile-specific disclaimer positioning
};

export const ComposerComponent = ({
    handleSendMessage,
    onAbort,
    isGenerating,
    isProcessingAttachment,
    className,
    inputContainerRef,
    isWebSearchButtonToggled,
    onToggleWebSearch,
    setIsEditorFocused,
    isEditorFocused,
    setIsEditorEmpty,
    messageChain = [], // Default to empty array for MainContainer
    handleOpenFiles,
    onShowDriveBrowser,
    isGuest,
    isSmallScreen,
}: ComposerComponentProps) => {
    const { isDragging: isDraggingOverScreen } = useDragArea();
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { hasTierErrors } = useTierErrors();
    const hasAttachments = provisionalAttachments.length > 0;
    const composerContainerRef = useRef<HTMLElement | null>(null);
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const { isGhostChatMode } = useGhostChat();
    const { canShowLumoUpsellFree } = useLumoPlan();

    // Get all relevant attachments for context calculations
    const allRelevantAttachments = useAllRelevantAttachments(messageChain, provisionalAttachments);

    // File handling hook
    const {
        fileInputRef,
        handleFileProcessing,
        handleFileInputChange,
        handleOpenFileDialog,
        handleBrowseDrive,
        handleDeleteAttachment,
    } = useFileHandling({ messageChain, onShowDriveBrowser });

    const handleWebSearchButtonClick = useCallback(() => {
        sendWebSearchButtonToggledEvent(isWebSearchButtonToggled);
        onToggleWebSearch();
    }, [onToggleWebSearch, isWebSearchButtonToggled]);

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

    const { editor, handleSubmit } = useTipTapEditor({
        onSubmitCallback: sendGenerateMessage,
        hasTierErrors,
        isGenerating,
        isProcessingAttachment,
        onFocus: () => setIsEditorFocused?.(true),
        onBlur: () => setIsEditorFocused?.(false),
    });
    const isEditorEmpty = editor?.isEmpty;
    const sendIsDisabled = !(isGenerating ?? false) && (isEditorEmpty || isProcessingAttachment);
    const canShowSendButton = (isGenerating ?? false) || !isEditorEmpty;

    // Update parent component when editor empty state changes
    useEffect(() => {
        setIsEditorEmpty?.(isEditorEmpty ?? true);
    }, [isEditorEmpty, setIsEditorEmpty]);

    const canShowLegalDisclaimer = isGuest && isSmallScreen && !isEditorFocused && isEditorEmpty;

    const canShowLumoUpsellToggle = (isGuest || canShowLumoUpsellFree) && !isSmallScreen;

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
                    {canShowLegalDisclaimer && <GuestDisclaimer />}

                    <div
                        className={clsx(
                            'lumo-input-container shadow-lifted bg-weak w-full',
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
                        />
                        <ComposerToolbar
                            fileInputRef={fileInputRef}
                            handleFileInputChange={handleFileInputChange}
                            handleOpenFileDialog={handleOpenFileDialog}
                            handleBrowseDrive={handleBrowseDrive}
                            showUploadMenu={showUploadMenu}
                            setShowUploadMenu={setShowUploadMenu}
                            handleUploadButtonClick={handleUploadButtonClick}
                            isWebSearchButtonToggled={isWebSearchButtonToggled}
                            handleWebSearchButtonClick={handleWebSearchButtonClick}
                            hasAttachments={hasAttachments}
                            canShowLumoUpsellToggle={canShowLumoUpsellToggle}
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
        </>
    );
};
