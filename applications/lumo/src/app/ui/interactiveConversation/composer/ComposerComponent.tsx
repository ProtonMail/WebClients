import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EditorContent } from '@tiptap/react';
import clsx from 'clsx';
import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { Icon, useNotifications } from '@proton/components';
import { IcGlobe, IcMicrophone, IcPaperClip } from '@proton/icons';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoStart from '@proton/styles/assets/img/illustrations/lumo-arrow.svg';
import lumoStop from '@proton/styles/assets/img/illustrations/lumo-stop.svg';
import useFlag from '@proton/unleash/useFlag';

import type { HandleSendMessage } from '../../../hooks/useLumoActions';
import { useTierErrors } from '../../../hooks/useTierErrors';
import useTipTapEditor from '../../../hooks/useTipTapEditor';
import { useDragArea } from '../../../providers/DragAreaProvider';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectProvisionalAttachments } from '../../../redux/selectors';
import { deleteAttachment } from '../../../redux/slices/core/attachments';
import { handleFileAsync } from '../../../services/files';
import type { Attachment, AttachmentId, Message } from '../../../types';
import { getAcceptAttributeString } from '../../../util/filetypes';
import {
    sendFileUploadEvent,
    sendFileUploadFromDriveEvent,
    sendVoiceEntryClickEvent,
    sendWebSearchButtonToggledEvent,
} from '../../../util/telemetry';
import { ContextProgressIndicator, ContextSizeWarning } from '../../components/Context';
import { AttachmentArea, FileCard, FileContentModal } from '../../components/Files';
import GuestDisclaimer from '../../components/GuestDisclaimer';
import LumoPlusToggle from './LumoPlusToggle';
import { UploadMenu } from './UploadMenu';

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

// Custom hook to get all attachments relevant for context calculations
const useAllRelevantAttachments = (messageChain: Message[], provisionalAttachments: Attachment[]) => {
    // Get the full attachments state
    const allAttachments = useLumoSelector((state) => state.attachments);

    // Get all attachment IDs from the message chain
    const messageAttachmentIds = useMemo(() => {
        if (!messageChain || messageChain.length === 0) return [];
        return messageChain.flatMap((message) => message.attachments?.map((attachment) => attachment.id) || []);
    }, [messageChain]);

    // Get full attachment data for all message attachments
    const messageAttachments = useMemo(() => {
        if (!messageAttachmentIds || messageAttachmentIds.length === 0) return [];
        return messageAttachmentIds.map((id) => allAttachments[id]).filter(Boolean) as Attachment[];
    }, [messageAttachmentIds, allAttachments]);

    // Combine provisional attachments with message attachments
    // Filter out duplicates (provisional attachments take precedence)
    const combinedAttachments = useMemo(() => {
        if (!provisionalAttachments) return messageAttachments;
        if (!messageAttachments || messageAttachments.length === 0) return provisionalAttachments;

        const provisionalIds = new Set(provisionalAttachments.map((a) => a.id));
        const uniqueMessageAttachments = messageAttachments.filter((a) => !provisionalIds.has(a.id));
        return [...provisionalAttachments, ...uniqueMessageAttachments];
    }, [provisionalAttachments, messageAttachments]);

    return combinedAttachments;
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
    const dispatch = useLumoDispatch();
    const { isDragging: isDraggingOverScreen } = useDragArea();
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { hasTierErrors } = useTierErrors();
    const hasAttachments = provisionalAttachments.length > 0;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadButtonRef = useRef<HTMLButtonElement>(null);
    const composerContainerRef = useRef<HTMLElement | null>(null);
    const isLumoToolingEnabled = useFlag('LumoTooling');
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const { isGhostChatMode } = useGhostChat();
    const { createNotification } = useNotifications();
    const { canShowLumoUpsellFree } = useLumoPlan();
    // Get all relevant attachments for context calculations
    const allRelevantAttachments = useAllRelevantAttachments(messageChain, provisionalAttachments);

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

    const handleDelete = async (id: AttachmentId) => {
        try {
            dispatch(deleteAttachment(id));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleFileProcessing = useCallback(
        async (file: File) => {
            try {
                // Log file processing start for user feedback
                console.log(`Starting file processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

                // Special messaging for large CSV files
                if (
                    (file.type === 'text/csv' ||
                        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.type === 'application/vnd.ms-excel') &&
                    file.size > 1024 * 1024
                ) {
                    // > 1MB
                    console.log(`Processing large spreadsheet file - this may take a moment...`);
                }

                const result = await dispatch(handleFileAsync(file, messageChain));

                if (result.isDuplicate) {
                    // Show toast notification for duplicate file
                    createNotification({
                        text: c('collider_2025: Error').t`File already added: ${result.fileName}`,
                        type: 'warning',
                    });
                } else if (result.isUnsupported) {
                    // Show toast notification for unsupported file
                    createNotification({
                        text: c('collider_2025: Error').t`File format not supported: ${result.fileName}`,
                        type: 'error',
                    });
                } else if (!result.success && result.errorMessage) {
                    // Show toast notification for processing error
                    createNotification({
                        text: c('collider_2025: Error').t`Error processing ${result.fileName}: ${result.errorMessage}`,
                        type: 'error',
                    });
                } else {
                    console.log(`File processing completed: ${file.name}`);
                }
            } catch (error) {
                console.error('Error processing file:', error);
                createNotification({
                    text: c('collider_2025: Error').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [dispatch, createNotification]
    );

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files?.length) return;

            const selectedFiles = Array.from(e.target.files);
            selectedFiles.forEach(handleFileProcessing);
        },
        [handleFileProcessing]
    );

    const handleOpenFileDialog = useCallback(() => {
        fileInputRef.current?.click();
        sendFileUploadEvent();
    }, []);

    const handleUploadButtonClick = useCallback(() => {
        setShowUploadMenu(!showUploadMenu);
    }, [showUploadMenu]);

    const handleBrowseDrive = useCallback(() => {
        onShowDriveBrowser?.();
        sendFileUploadFromDriveEvent();
    }, [onShowDriveBrowser]);

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
    const sendIsDisabled = !isGenerating && (isEditorEmpty || isProcessingAttachment);
    const canShowSendButton = isGenerating || !isEditorEmpty;

    // Update parent component when editor empty state changes
    useEffect(() => {
        setIsEditorEmpty?.(isEditorEmpty ?? true);
    }, [isEditorEmpty, setIsEditorEmpty]);
    const canShowLegalDisclaimer = isGuest && isSmallScreen && !isEditorFocused && isEditorEmpty;

    const enterBoldText = (
        <kbd
            key={c('collider_2025: Characteristic Title').t`Enter`} // only there to prevent a react warning
        >{c('collider_2025: Characteristic Title').t`Enter`}</kbd>
    );

    const canShowLumoUpsellToggle = isGuest || canShowLumoUpsellFree;

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
                            <div className="attachments w-full flex flex-column flex-nowrap">
                                {/* Context Progress Indicator - shows usage percentage */}
                                <ContextProgressIndicator
                                    attachments={allRelevantAttachments}
                                    messageChain={messageChain}
                                />
                                {/* Context Size Warning - only shows when needed */}
                                <ContextSizeWarning
                                    attachments={allRelevantAttachments}
                                    messageChain={messageChain}
                                    onOpenFiles={handleOpenFiles}
                                />
                                <div className="flex flex-row gap-3 px-2 overflow-x-auto py-2">
                                    {provisionalAttachments.map((a) => (
                                        <FileCard
                                            key={a.id}
                                            attachment={a}
                                            onRemove={() => handleDelete(a.id)}
                                            onView={(attachment) => setFileToView(attachment)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div
                            className="lumo-input flex-grow w-full z-30 flex flex-row flex-nowrap items-center gap-3 p-2 pl-3 min-h-custom my-auto border border-weak bg-norm"
                            style={{ '--min-h-custom': '3.5rem' /*56px*/ }}
                        >
                            {/* main text area where user types */}
                            <EditorContent
                                editor={editor}
                                className="flex flex-row items-center w-full overflow-y-auto p-1 max-h-custom"
                                style={{ '--max-h-custom': '13.125rem' /*210px*/ }}
                            />

                            {canShowSendButton && (
                                <div className="flex flex-row self-end items-end gap-1 h-full shrink-0 composer-submit-button">
                                    {/* send button (becomes abort button during generation) */}
                                    <Tooltip
                                        title={
                                            isProcessingAttachment
                                                ? c('collider_2025: Info').t`Please wait for files to finish processing`
                                                : isGenerating
                                                  ? c('collider_2025: Action').t`Stop generating`
                                                  : c('collider_2025: Action').t`Send message`
                                        }
                                    >
                                        <Button
                                            icon
                                            className="rounded-full p-0 ratio-square border-0 w-custom"
                                            size="small"
                                            style={{ inlineSize: '2.25rem' /* 36px */ }}
                                            disabled={sendIsDisabled}
                                            onClick={isGenerating ? onAbort : handleSubmit}
                                            color="norm"
                                        >
                                            <img
                                                src={isGenerating ? lumoStop : lumoStart}
                                                alt={
                                                    isGenerating
                                                        ? c('collider_2025: Action').t`Stop generating`
                                                        : c('collider_2025: Action').t`Start generating`
                                                }
                                            />
                                        </Button>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-row flex-nowrap items-center justify-space-between w-full mt-1">
                            <div className="flex flex-row flex-nowrap items-center gap-2 pl-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    id="emptyFileCardInput"
                                    accept={getAcceptAttributeString()}
                                    className="hidden"
                                    multiple
                                    onChange={handleFileInputChange}
                                ></input>
                                <div className="relative">
                                    <Button
                                        ref={uploadButtonRef}
                                        icon
                                        className={clsx(
                                            'border-0 shrink-0 flex flex-row flex-nowrap gap-1 items-center color-weak',
                                            showUploadMenu && 'is-active'
                                        )}
                                        onClick={handleUploadButtonClick}
                                        shape="ghost"
                                        size="small"
                                    >
                                        <IcPaperClip size={6}></IcPaperClip>
                                        <span className="hidden sm:block text-sm mt-0.5">{c('collider_2025: Button')
                                            .t`Upload`}</span>
                                    </Button>
                                    <UploadMenu
                                        isOpen={showUploadMenu}
                                        onClose={() => setShowUploadMenu(false)}
                                        onUploadFromComputer={handleOpenFileDialog}
                                        onBrowseDrive={handleBrowseDrive}
                                        buttonRef={uploadButtonRef}
                                    />
                                </div>
                                {isLumoToolingEnabled && (
                                    <Button
                                        icon
                                        className={clsx(
                                            'web-search-button order-0 shrink-0 inline-flex flex-row flex-nowrap gap-1 items-center color-weak',
                                            isWebSearchButtonToggled && 'is-active'
                                        )}
                                        disabled={hasAttachments}
                                        onClick={handleWebSearchButtonClick}
                                        shape="ghost"
                                        size="small"
                                    >
                                        <IcGlobe size={6}></IcGlobe>
                                        <span className=" hidden sm:block text-sm mt-0.5">{c('collider_2025: Button')
                                            .t`Web search`}</span>
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-row flex-nowrap items-center gap-2 mr-2">
                                <div
                                    className={clsx('flex flex-row flex-nowrap gap-2 color-hint hidden')}
                                    id="voice-entry-mobile"
                                >
                                    <Button
                                        icon
                                        id="voice-entry-mobile-button"
                                        className="border-0 shrink-0 inline-flex flex-row flex-nowrap gap-1 items-center color-weak"
                                        shape="ghost"
                                        size="small"
                                    >
                                        <IcMicrophone size={6}></IcMicrophone>
                                    </Button>
                                </div>
                                {/* <div className="hidden sm:flex flex-row flex-nowrap gap-2 color-hint prompt-entry-hint"> */}
                                {canShowLumoUpsellToggle ? (
                                    <div className="flex flex-row">
                                        <LumoPlusToggle />
                                    </div>
                                ) : (
                                    <div className="hidden sm:flex flex-row flex-nowrap gap-2 color-hint prompt-entry-hint">
                                        <Icon name="arrow-left-and-down" />
                                        <span className="text-xs">{c('collider_2025: Info')
                                            .jt`Press ${enterBoldText} to ask`}</span>
                                    </div>
                                )}
                                {/* </div> */}
                            </div>
                        </div>
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
