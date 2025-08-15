import React, { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, SettingsLink, useNotifications } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { IcArrowLeft, IcBrandProtonDrive, IcCross, IcInfoCircle } from '@proton/icons';
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoDrive from '@proton/styles/assets/img/lumo/lumo-drive.svg';

import { useFilteredFiles } from '../../../../hooks';
import type { DriveNode } from '../../../../hooks/useDriveSDK';
import { useIsGuest } from '../../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../../redux/hooks';
import { selectContextFilters } from '../../../../redux/selectors';
import { addContextFilter, removeContextFilter } from '../../../../redux/slices/contextFilters';
import { deleteAttachment } from '../../../../redux/slices/core/attachments';
import { handleFileAsync } from '../../../../services/files';
import type { Attachment, Message } from '../../../../types';
import { getMimeTypeFromExtension } from '../../../../util/filetypes';
import { DriveBrowser } from '../DriveBrowser';
import { ContextProgressBar } from './ContextProgressBar';
import { KnowledgeFileItem } from './KnowledgeFileItem';

const MEDIUM_SCREEN_BREAK = 1024;

interface FilesPanelProps {
    messageChain: Message[];
    filesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    isModal: boolean;
    onViewFile?: (attachment: any) => void;
    currentAttachments?: Attachment[]; // Current provisional attachments
    filterMessage?: Message; // Optional message to filter by
    onClearFilter?: () => void; // Optional callback to clear the filter
    initialShowDriveBrowser?: boolean; // Whether to show Drive browser initially
}

export const FilesPanel = ({
    messageChain,
    filesContainerRef,
    onClose,
    handleLinkClick,
    isModal,
    onViewFile,
    currentAttachments = [],
    filterMessage,
    onClearFilter,
    initialShowDriveBrowser = false,
}: FilesPanelProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const contextFilters = useLumoSelector(selectContextFilters);
    const [selectedFiles] = useState<Set<string>>(new Set());

    // Drive browser state
    const [showDriveBrowser, setShowDriveBrowser] = useState(initialShowDriveBrowser);

    // Knowledge explanation state
    const [showKnowledgeExplanation, setShowKnowledgeExplanation] = useState(false);

    const { allFiles, activeHistoricalFiles, unusedHistoricalFiles, nextQuestionFiles } = useFilteredFiles(
        messageChain,
        currentAttachments,
        filterMessage
    );

    const handleIncludeHistoricalFile = (file: any) => {
        dispatch(removeContextFilter({ messageId: file.messageId, filename: file.filename }));
    };

    const handleExcludeHistoricalFile = (file: any) => {
        dispatch(addContextFilter({ messageId: file.messageId, filename: file.filename }));
    };

    const handleDriveFileSelect = React.useCallback(
        async (file: DriveNode, content: Uint8Array<ArrayBuffer>) => {
            try {
                // Use the MIME type from the file metadata, or derive it from the extension
                const detectedMimeType = getMimeTypeFromExtension(file.name);
                let mimeType = file.mimeType || detectedMimeType;
                let fileName = file.name;

                const fileBlob = new Blob([content], { type: mimeType });
                const fileObject = new File([fileBlob], fileName, {
                    type: mimeType,
                    lastModified: file.modifiedTime || Date.now(),
                });

                // Process the file through the same pipeline as uploaded files
                console.log(
                    `Processing downloaded Drive file: ${file.name} (${(content.length / 1024 / 1024).toFixed(2)} MB)`
                );
                const result = await dispatch(handleFileAsync(fileObject, messageChain));

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
                    // Show success notification
                    createNotification({
                        text: c('collider_2025: Success').t`File added to knowledge base: ${result.fileName}`,
                        type: 'success',
                    });
                }
            } catch (error) {
                console.error('Failed to process downloaded Drive file:', error);
                createNotification({
                    text: c('collider_2025: Error').t`Failed to process ${DRIVE_SHORT_APP_NAME} file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [dispatch, createNotification]
    );

    const handleDriveError = React.useCallback((error: Error) => {
        console.error('Drive browser error:', error);
        // Note: createNotification is not available in this component
        // You could add a toast notification here if needed
    }, []);

    const handleRemoveSelected = () => {
        // Remove selected files logic would go here
    };

    const handleFileClick = (file: any, fullAttachment: any, e: React.MouseEvent) => {
        e.preventDefault();
        onViewFile?.(fullAttachment);
    };

    const isGuest = useIsGuest();

    // Custom breakpoint hook using window.innerWidth
    const [isMediumScreen, setIsMediumScreen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= MEDIUM_SCREEN_BREAK; // medium breakpoint is typically around 1024px
        }
        return false;
    });

    useEffect(() => {
        const handleResize = () => {
            const isMedium = window.innerWidth <= MEDIUM_SCREEN_BREAK;
            setIsMediumScreen(isMedium);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // If showing Drive browser, render it instead of the normal files panel
    if (showDriveBrowser) {
        // For guest users, show upsell instead of trying to render DriveBrowser
        if (isGuest) {
            return (
                <div
                    className={`files-panel h-full ${isModal ? 'w-full modal-files-panel' : isMediumScreen ? 'w-1/2 pt-2 pr-4 pb-6' : 'w-1/3 pt-2 pr-4 pb-6'}`}
                    ref={filesContainerRef}
                >
                    <div
                        className={`w-full h-full ${isModal ? 'rounded-none shadow-none' : 'p-4 rounded-xl bg-norm shadow-lifted'} overflow-hidden`}
                    >
                        <div className="h-full bg-norm">
                            {/* Header */}
                            <div className="flex flex-row flex-nowrap items-center justify-space-between mb-2">
                                <div className="flex flex-row items-center gap-1">
                                    {!initialShowDriveBrowser && (
                                        <Button onClick={() => setShowDriveBrowser(false)} size="small" shape="ghost">
                                            <IcArrowLeft size={4} />
                                        </Button>
                                    )}
                                    <p className="m-0 text-lg text-bold">{DRIVE_APP_NAME}</p>
                                </div>

                                <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                                    <IcCross />
                                </Button>
                            </div>

                            {/* Upsell Content */}
                            <div
                                className="flex flex-column items-center justify-center text-center"
                                style={{ height: 'calc(100% - 60px)' }}
                            >
                                <img
                                    className="w-custom h-custom mx-auto mt-6 mb-6"
                                    src={lumoDrive}
                                    alt="Lumo + Proton Drive"
                                    style={{ '--w-custom': '11.5rem' }}
                                />
                                <h3 className="text-bold color-primary">
                                    {c('collider_2025: Info').t`Access ${DRIVE_APP_NAME}`}
                                </h3>
                                <p className="color-weak text-md">
                                    {c('collider_2025: Info')
                                        .t`Sign in or create an account to browse and add files from your ${DRIVE_APP_NAME} (end-to-end encrypted cloud storage) to your chat knowledge.`}
                                </p>

                                {(isMediumScreen || isModal) && (
                                    <div className={'flex flex-col items-center gap-2'}>
                                        <PromotionButton
                                            as={SettingsLink}
                                            path="/signup"
                                            shape="solid"
                                            color="warning"
                                            className={'mx-auto'}
                                            buttonGradient={false}
                                        >{c('collider_2025: Link').t`Create a free account`}</PromotionButton>

                                        <PromotionButton
                                            buttonGradient={false}
                                            as={SettingsLink}
                                            path="/signin"
                                            className={'mx-auto'}
                                            shape="outline"
                                            color="weak"
                                        >
                                            {c('collider_2025: Link').t`Sign in`}
                                        </PromotionButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div
                className={`files-panel h-full ${isModal ? 'w-full modal-files-panel' : isMediumScreen ? 'w-1/2 pt-2 pr-4 pb-6' : 'w-1/3 pt-2 pr-4 pb-6'}`}
                ref={filesContainerRef}
            >
                <div
                    className={`w-full h-full  ${isModal ? 'rounded-none shadow-none' : 'files-panel-content flex flex-column flex-nowrap w-full bg-norm rounded-xl shadow-lifted'} relative`}
                >
                    <DriveBrowser
                        onFileSelect={handleDriveFileSelect}
                        onError={handleDriveError}
                        onClose={onClose}
                        onBack={() => setShowDriveBrowser(false)}
                        isModal={isModal}
                        autoRefreshInterval={0} // Disable auto-refresh
                        initialShowDriveBrowser={initialShowDriveBrowser}
                        existingFiles={[...allFiles, ...currentAttachments].map((file) => ({
                            filename: file.filename,
                            rawBytes: file.rawBytes,
                        }))}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`files-panel h-full ${isModal ? 'w-full modal-files-panel' : isMediumScreen ? 'w-1/2 pt-2 pr-4 pb-6' : 'w-1/3 pt-2 pr-4 pb-6'}`}
            ref={filesContainerRef}
        >
            <div
                className={`files-panel-content flex flex-column flex-nowrap w-full rounded-xl bg-norm shadow-lifted w-full h-full ${isModal ? '' : 'p-4'}`}
            >
                <div className="mb-4">
                    <div className="flex flex-row flex-nowrap items-center justify-space-between mb-2">
                        <p className="m-0 text-lg text-bold">{c('collider_2025: Info').t`Chat knowledge`}</p>

                        <div className="flex flex-row items-center gap-1">
                            <Button
                                size="medium"
                                shape="solid"
                                onClick={() => setShowDriveBrowser(true)}
                                className="shrink-0 button-bg-weak"
                            >
                                <IcBrandProtonDrive size={4} />
                                <span className="text-sm ml-2">{c('collider_2025: Action')
                                    .t`Browse ${DRIVE_SHORT_APP_NAME}`}</span>
                            </Button>
                            <Button icon className="shrink-0 " size="medium" shape="ghost" onClick={onClose}>
                                <IcCross />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filter chip - replaces breadcrumb navigation */}
                {filterMessage && (
                    <div className="mb-4 flex flex-row items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-secondary-minor text-info rounded-lg border border-info">
                            <Icon name="filter" size={3} />
                            <span className="text-sm">{c('collider_2025: Info').t`Remove message filter`}</span>
                            {onClearFilter && (
                                <Button
                                    size="small"
                                    shape="ghost"
                                    icon
                                    onClick={onClearFilter}
                                    className="text-info hover:text-info-dark p-1 -mr-1"
                                    title={c('collider_2025: Info').t`Show all files`}
                                >
                                    <Icon name="cross" size={3} />
                                </Button>
                            )}
                        </span>
                    </div>
                )}

                {selectedFiles.size > 0 && (
                    <div className="flex flex-row flex-nowrap items-center justify-space-between mb-4 p-2 bg-weak rounded">
                        <span className="text-sm">
                            {selectedFiles.size} {c('collider_2025: Info').t`selected`}
                        </span>
                        <Button size="small" color="danger" onClick={handleRemoveSelected}>
                            {c('collider_2025: Info').t`Remove`}
                        </Button>
                    </div>
                )}

                <div className="flex-1 flex-row overflow-y-auto" style={{ minHeight: '35vh' }}>
                    {/* When filtering, show all files from the message */}
                    {filterMessage && allFiles.length > 0 && (
                        <div className="mb-6 w-full">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Icon name="file" size={4} />
                                {c('collider_2025: Info').t`Files`} ({allFiles.length})
                            </h3>

                            {allFiles.map((file) => (
                                <KnowledgeFileItem
                                    key={`${file.messageId}-${file.id}`}
                                    file={file}
                                    onView={handleFileClick}
                                    isActive={true}
                                    readonly={true} // Make files readonly when filtering
                                />
                            ))}
                        </div>
                    )}

                    {/* When not filtering, show normal view */}
                    {!filterMessage && (
                        <>
                            {/* Next Question Knowledge */}
                            {nextQuestionFiles.length > 0 && (
                                <div className="mb-3 w-full p-4 active-files-area">
                                    <h3 className="text-sm text-bold mb-3 flex items-center gap-2">
                                        {c('collider_2025: Info').t`Active`}
                                        <span className={'text-normal color-weak'}>{nextQuestionFiles.length}</span>
                                    </h3>

                                    {/* New uploads */}
                                    {currentAttachments?.map((attachment) => (
                                        <KnowledgeFileItem
                                            key={attachment.id}
                                            file={attachment}
                                            onView={(file, fullAttachment, e) =>
                                                onViewFile && onViewFile(fullAttachment)
                                            }
                                            onRemove={(id) => dispatch(deleteAttachment(id))}
                                            isActive={true}
                                            showToggle={false}
                                        />
                                    ))}
                                    {/* Active historical files */}
                                    {activeHistoricalFiles.map((file) => (
                                        <KnowledgeFileItem
                                            key={`${file.messageId}-${file.id}`}
                                            file={file}
                                            onView={handleFileClick}
                                            onExclude={() => handleExcludeHistoricalFile(file)}
                                            isActive={true}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Unused Knowledge */}
                            {unusedHistoricalFiles.length > 0 && (
                                <div className="mb-4 w-full p-4">
                                    <h3 className="text-sm text-bold mb-3 flex items-center gap-2">
                                        {c('collider_2025: Info').t`Unused `}
                                        <span className={'text-normal color-weak'}>{unusedHistoricalFiles.length}</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {unusedHistoricalFiles.map((file) => (
                                            <KnowledgeFileItem
                                                key={`${file.messageId}-${file.id}`}
                                                file={file}
                                                onView={handleFileClick}
                                                onInclude={() => handleIncludeHistoricalFile(file)}
                                                isActive={false}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Empty State */}
                    {allFiles.length === 0 && currentAttachments?.length === 0 && (
                        <div className="flex flex-1 flex-column items-center justify-center text-center h-full">
                            <Icon name="file" size={8} className="color-weak mb-2" />
                            <p className="color-weak text-sm m-0">{c('collider_2025: Info').t`No files available`}</p>
                        </div>
                    )}
                </div>

                {/* Only show context progress and explanation when not filtering */}
                {!filterMessage && (
                    <div>
                        {/* Knowledge Base Explanation */}
                        <div className="mb-4 p-3 knowledge-info-area rounded border border-weak">
                            <div
                                className="flex flex-row items-center gap-2 cursor-pointer"
                                onClick={() => setShowKnowledgeExplanation(!showKnowledgeExplanation)}
                            >
                                <IcInfoCircle />
                                <h4 className="m-0 text-sm font-semibold flex-1">
                                    {c('collider_2025: Info').t`File capacity for this conversation`}
                                </h4>
                                <Icon
                                    name={showKnowledgeExplanation ? 'chevron-up' : 'chevron-down'}
                                    size={4}
                                    className="color-weak shrink-0"
                                />
                            </div>

                            {showKnowledgeExplanation && (
                                <div className="mt-3 pl-6">
                                    <p className="m-0 text-sm color-weak leading-relaxed">
                                        {c('collider_2025: Info')
                                            .t`For each conversation, ${LUMO_SHORT_APP_NAME} has the capacity to process a limited amount of information. The progress bar shows how much capacity your current files are using. `}
                                    </p>
                                </div>
                            )}
                        </div>

                        <ContextProgressBar
                            messageChain={messageChain}
                            contextFilters={contextFilters}
                            currentAttachments={currentAttachments}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
