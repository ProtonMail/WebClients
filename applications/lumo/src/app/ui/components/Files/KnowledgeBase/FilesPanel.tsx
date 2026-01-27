import React, { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, SettingsLink, useNotifications } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoDrive from '@proton/styles/assets/img/lumo/lumo-drive.svg';

import { useFileProcessing, useFilteredFiles } from '../../../../hooks';
import type { DriveNode } from '../../../../hooks/useDriveSDK';
import { useIsGuest } from '../../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../../redux/hooks';
import { selectAttachments, selectContextFilters, selectSpaceByIdOptional } from '../../../../redux/selectors';
import { addContextFilter, removeContextFilter } from '../../../../redux/slices/contextFilters';
import { deleteAttachment } from '../../../../redux/slices/core/attachments';
import { handleFileAsync } from '../../../../services/files';
import { SearchService } from '../../../../services/search/searchService';
import { type Attachment, type Message, getProjectInfo } from '../../../../types';
import type { DriveDocument } from '../../../../types/documents';
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
    spaceId?: string; // Optional space ID to include space-level attachments
}

export const FilesPanel = ({
    messageChain,
    filesContainerRef,
    onClose,
    isModal,
    onViewFile,
    currentAttachments = [],
    filterMessage,
    onClearFilter,
    initialShowDriveBrowser = false,
    spaceId,
}: FilesPanelProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const contextFilters = useLumoSelector(selectContextFilters);
    const [selectedFiles] = useState<Set<string>>(new Set());
    const fileProcessingService = useFileProcessing();

    // Drive browser state
    const [showDriveBrowser, setShowDriveBrowser] = useState(initialShowDriveBrowser);

    // Knowledge explanation state
    const [showKnowledgeExplanation, setShowKnowledgeExplanation] = useState(false);

    const { allFiles, activeHistoricalFiles, unusedHistoricalFiles } = useFilteredFiles(
        messageChain,
        currentAttachments,
        filterMessage,
        spaceId
    );

    // Get space to check for linked Drive folder
    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const { linkedDriveFolder } = getProjectInfo(space);

    // Get user for search service
    const user = useLumoSelector((state) => state.user?.value);

    // Get all attachments from Redux to find auto-retrieved ones
    const allAttachmentsState = useLumoSelector(selectAttachments);

    // Collect all auto-retrieved attachments from this conversation (both Drive and project files)
    // Deduplicate by driveNodeId or filename (same document may be retrieved multiple times across messages)
    // Also track which message they belong to so we can use context filters
    const autoRetrievedAttachments = React.useMemo(() => {
        const attachmentsByKey = new Map<string, Attachment & { messageId: string }>();

        messageChain.forEach((msg) => {
            if (msg.attachments) {
                msg.attachments.forEach((shallowAtt) => {
                    const fullAtt = allAttachmentsState[shallowAtt.id];
                    // Check autoRetrieved on BOTH shallow and full attachment
                    // For project files, autoRetrieved is on the shallow attachment (we skip upserting to Redux)
                    // For Drive files, it's on both
                    const isAutoRetrieved = shallowAtt.autoRetrieved || fullAtt?.autoRetrieved;

                    if (isAutoRetrieved) {
                        // Skip if the attachment was deleted (e.g., Drive folder unlinked, file deleted)
                        // For Drive files (driveNodeId present), we require fullAtt to exist
                        // This prevents showing files from unlinked Drive folders
                        if (shallowAtt.driveNodeId && !fullAtt) {
                            console.log(
                                '[FilesPanel] Skipping deleted Drive attachment:',
                                shallowAtt.id,
                                shallowAtt.filename
                            );
                            return;
                        }

                        // Use the fullAtt data if available, otherwise construct from shallow
                        const attachment =
                            fullAtt ||
                            ({
                                ...shallowAtt,
                                filename: shallowAtt.filename || 'Unknown file',
                            } as Attachment);

                        // Merge autoRetrieved and isUploadedProjectFile from shallow if not in full
                        const mergedAtt = {
                            ...attachment,
                            autoRetrieved: true,
                            isUploadedProjectFile: shallowAtt.isUploadedProjectFile || fullAtt?.isUploadedProjectFile,
                            relevanceScore: shallowAtt.relevanceScore ?? fullAtt?.relevanceScore,
                        };

                        // Use driveNodeId for deduplication, fallback to filename
                        const key = mergedAtt.driveNodeId || mergedAtt.filename;
                        // Keep the one with highest relevance score
                        const existing = attachmentsByKey.get(key);
                        if (!existing || (mergedAtt.relevanceScore ?? 0) > (existing.relevanceScore ?? 0)) {
                            // Include messageId so context filters can work
                            attachmentsByKey.set(key, { ...mergedAtt, messageId: msg.id });
                        }
                    }
                });
            }
        });

        // Sort by relevance score descending (highest relevance first)
        return Array.from(attachmentsByKey.values()).sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }, [messageChain, allAttachmentsState]);

    // Check if an auto-retrieved file is currently excluded
    const isAutoRetrievedExcluded = (file: Attachment & { messageId: string }) => {
        const filter = contextFilters.find((f: any) => f.messageId === file.messageId);
        return filter ? filter.excludedFiles.includes(file.filename) : false;
    };

    // Split auto-retrieved into active and excluded
    const activeAutoRetrieved = autoRetrievedAttachments.filter((f) => !isAutoRetrievedExcluded(f));
    const excludedAutoRetrieved = autoRetrievedAttachments.filter((f) => isAutoRetrievedExcluded(f));

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
                const mimeType = file.mediaType || detectedMimeType;
                const fileName = file.name;

                const fileBlob = new Blob([content], { type: mimeType });
                const fileObject = new File([fileBlob], fileName, {
                    type: mimeType,
                    lastModified: file.modifiedTime?.getTime() || Date.now(),
                });

                // Process the file through the same pipeline as uploaded files
                console.log(
                    `Processing downloaded Drive file: ${file.name} (${(content.length / 1024 / 1024).toFixed(2)} MB)`
                );
                const result = await dispatch(handleFileAsync(fileObject, messageChain, fileProcessingService));

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

                    // If we're in a project context, also index the file for RAG search
                    if (spaceId && result.success && result.attachmentId && result.markdown) {
                        try {
                            const userId = user?.ID;
                            if (userId) {
                                const searchService = SearchService.get(userId);
                                const document: DriveDocument = {
                                    id: result.attachmentId,
                                    name: fileName,
                                    content: result.markdown,
                                    mimeType: mimeType,
                                    size: content.length,
                                    modifiedTime: Date.now(),
                                    folderId: spaceId,
                                    folderPath: 'Uploaded Files',
                                    spaceId,
                                };
                                await searchService.indexDocuments([document]);
                                console.log(`[FilesPanel] Indexed file for RAG: ${fileName}`);
                            }
                        } catch (indexError) {
                            console.warn('[FilesPanel] Failed to index file for RAG:', indexError);
                            // Don't fail the upload if indexing fails
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to process downloaded Drive file:', error);
                createNotification({
                    text: c('collider_2025: Error').t`Failed to process ${DRIVE_SHORT_APP_NAME} file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [dispatch, createNotification, spaceId, user]
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
                    // eslint-disable-next-line no-nested-ternary
                    className={`files-panel h-full ${isModal ? 'w-full modal-files-panel' : isMediumScreen ? 'w-1/2 pt-2 pr-4 pb-6 bg-weak' : 'w-1/3 pt-2 pr-4 pb-6 bg-weak'}`}
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
                // eslint-disable-next-line no-nested-ternary
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
            // eslint-disable-next-line no-nested-ternary
            className={`files-panel h-full ${isModal ? 'w-full modal-files-panel' : isMediumScreen ? 'w-1/2 pt-2 pr-4 pb-6' : 'w-1/3 pt-2 pr-4 pb-6'}`}
            ref={filesContainerRef}
        >
            <div
                className={`files-panel-content flex flex-column flex-nowrap w-full rounded-xl bg-norm shadow-lifted w-full h-full ${isModal ? '' : 'p-4 bg-weak'}`}
            >
                <div className="mb-4">
                    <div className="flex flex-row items-center justify-space-between mb-2">
                        <div className="flex flex-row flex-nowrap items-center gap-1">
                            <Button icon className="shrink-0 " size="small" shape="ghost" onClick={onClose}>
                                <IcCross />
                            </Button>
                            <p className="m-0 text-lg text-bold">{c('collider_2025: Info').t`Chat knowledge`}</p>
                        </div>

                        {/* <div className="flex flex-row items-center gap-1"> */}
                        {!linkedDriveFolder && (
                            <Button
                                size="medium"
                                shape="solid"
                                onClick={() => setShowDriveBrowser(true)}
                                className="shrink-0 bg-strong flex flex-row flex-nowrap items-center"
                                title={c('collider_2025: Action').t`Browse ${DRIVE_SHORT_APP_NAME}`}
                            >
                                <IcBrandProtonDrive size={4} />
                                <span className="text-sm ml-2 hidden md:flex">{c('collider_2025: Action')
                                    .t`Browse ${DRIVE_SHORT_APP_NAME}`}</span>
                            </Button>
                        )}
                        {/* </div> */}
                    </div>
                </div>

                {/* Filter chip - replaces breadcrumb navigation */}
                {filterMessage && (
                    <div className="mb-4 flex flex-row items-center gap-2">
                        {onClearFilter && (
                            <Button
                                size="small"
                                shape="solid"
                                icon={true}
                                onClick={onClearFilter}
                                className="text-info hover:text-info-dark p-2 -mr-1 shrink-0 inline-flex items-center gap-2"
                                title={c('collider_2025: Info').t`Show all files`}
                            >
                                <Icon name="cross" size={3} />
                                <span className="text-sm">{c('collider_2025: Info').t`Remove message filter`}</span>
                            </Button>
                        )}
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
                    {/* When filtering, show files from the message */}
                    {filterMessage &&
                        (() => {
                            // All files retrieved for this message (both uploaded and Drive files now use RAG)
                            const autoRetrievedFiles = allFiles.filter((f) => (f as any).autoRetrieved);
                            const manualFiles = allFiles.filter((f) => !(f as any).autoRetrieved);

                            // Split auto-retrieved by active/excluded
                            const activeAutoFiles = autoRetrievedFiles.filter((f) => {
                                const filter = contextFilters.find((cf: any) => cf.messageId === (f as any).messageId);
                                return !filter || !filter.excludedFiles.includes(f.filename);
                            });
                            const excludedAutoFiles = autoRetrievedFiles.filter((f) => {
                                const filter = contextFilters.find((cf: any) => cf.messageId === (f as any).messageId);
                                return filter && filter.excludedFiles.includes(f.filename);
                            });

                            return (
                                <>
                                    {/* Auto-retrieved files section when filtering */}
                                    {autoRetrievedFiles.length > 0 && (
                                        <div className="mb-3 w-full p-4 bg-weak rounded border border-weak">
                                            <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
                                                <Icon name="folder-open" size={4} className="color-norm" />
                                                {c('collider_2025: Info').t`Retrieved Project Knowledge`}
                                            </h3>
                                            <p className="text-xs color-weak mb-3">
                                                {c('collider_2025: Info')
                                                    .t`Files automatically retrieved based on your question.`}
                                            </p>
                                            {activeAutoFiles.map((file) => (
                                                <KnowledgeFileItem
                                                    key={`${file.messageId}-${file.id}`}
                                                    file={file}
                                                    onView={handleFileClick}
                                                    isActive={true}
                                                    onExclude={() => handleExcludeHistoricalFile(file)}
                                                />
                                            ))}

                                            {/* Removed from future questions when filtering */}
                                            {excludedAutoFiles.length > 0 && (
                                                <div className="mt-3 pt-3 border-top border-weak">
                                                    <h4 className="text-xs color-weak mb-2">
                                                        {c('collider_2025: Info').t`Removed from future questions`}
                                                    </h4>
                                                    {excludedAutoFiles.map((file) => (
                                                        <KnowledgeFileItem
                                                            key={`${file.messageId}-${file.id}`}
                                                            file={file}
                                                            onView={handleFileClick}
                                                            isActive={false}
                                                            onInclude={() => handleIncludeHistoricalFile(file)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Manual files section when filtering */}
                                    {manualFiles.length > 0 && (
                                        <div className="mb-6 w-full">
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <Icon name="file" size={4} />
                                                {c('collider_2025: Info').t`Attached Files`} ({manualFiles.length})
                                            </h3>

                                            {manualFiles.map((file) => (
                                                <KnowledgeFileItem
                                                    key={`${file.messageId}-${file.id}`}
                                                    file={file}
                                                    onView={handleFileClick}
                                                    isActive={true}
                                                    readonly={true}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                    {/* When not filtering, show normal view */}
                    {!filterMessage && (
                        <>
                            {(linkedDriveFolder || autoRetrievedAttachments.length > 0) && (
                                <div className="mb-3 w-full p-4 bg-weak rounded border border-weak">
                                    <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
                                        <Icon name="folder-open" size={4} className="color-norm" />
                                        {c('collider_2025: Info').t`Retrieved Project Knowledge`}
                                    </h3>

                                    {activeAutoRetrieved.length === 0 ? (
                                        <p className="text-xs color-weak mb-3">
                                            {c('collider_2025: Info')
                                                .t`Relevant files will be automatically retrieved based on your questions.`}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-xs color-weak mb-3">
                                                {c('collider_2025: Info')
                                                    .t`Files automatically retrieved based on your questions:`}
                                            </p>
                                            {/* Active auto-retrieved files */}
                                            {activeAutoRetrieved.map((attachment) => (
                                                <KnowledgeFileItem
                                                    key={attachment.id}
                                                    file={attachment}
                                                    onView={handleFileClick}
                                                    isActive={true}
                                                    onExclude={() => handleExcludeHistoricalFile(attachment)}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Manually Attached Files - only show non-auto-retrieved files */}
                            {(() => {
                                // Filter out auto-retrieved from current attachments (historical files already filtered by hook)
                                const nonAutoRetrievedCurrentAttachments = currentAttachments.filter(
                                    (a) => !a.autoRetrieved
                                );
                                const totalManual =
                                    nonAutoRetrievedCurrentAttachments.length + activeHistoricalFiles.length;

                                if (totalManual === 0) return null;

                                return (
                                    <div className="mb-3 w-full p-4 bg-weak rounded border border-weak">
                                        <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
                                            <Icon name="paper-clip" size={4} className="color-norm" />
                                            {c('collider_2025: Info').t`Attached Files`}
                                            <span className={'text-normal color-weak'}>{totalManual}</span>
                                        </h3>
                                        <p className="text-xs color-weak mb-3">
                                            {c('collider_2025: Info').t`Files you've added to this conversation.`}
                                        </p>

                                        {/* New uploads (non-auto-retrieved) */}
                                        {nonAutoRetrievedCurrentAttachments.map((attachment) => (
                                            <KnowledgeFileItem
                                                key={attachment.id}
                                                file={attachment}
                                                onView={(file, fullAttachment) =>
                                                    onViewFile && onViewFile(fullAttachment)
                                                }
                                                onRemove={(id) => dispatch(deleteAttachment(id))}
                                                isActive={true}
                                                showToggle={false}
                                            />
                                        ))}
                                        {/* Active historical files (already filtered by hook to exclude auto-retrieved) */}
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
                                );
                            })()}

                            {/* Excluded files - files removed from future questions */}
                            {(excludedAutoRetrieved.length > 0 || unusedHistoricalFiles.length > 0) && (
                                <div className="mb-4 w-full p-4 bg-weak rounded border border-weak opacity-70">
                                    <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
                                        <Icon name="eye-slash" size={4} className="color-weak" />
                                        {c('collider_2025: Info').t`Excluded`}
                                        <span className={'text-normal color-weak'}>
                                            {excludedAutoRetrieved.length + unusedHistoricalFiles.length}
                                        </span>
                                    </h3>
                                    <p className="text-xs color-weak mb-3">
                                        {c('collider_2025: Info').t`These files won't be used for future questions.`}
                                    </p>
                                    <div className="space-y-2">
                                        {/* Excluded auto-retrieved files */}
                                        {excludedAutoRetrieved.map((attachment) => (
                                            <KnowledgeFileItem
                                                key={attachment.id}
                                                file={attachment}
                                                onView={handleFileClick}
                                                isActive={false}
                                                onInclude={() => handleIncludeHistoricalFile(attachment)}
                                            />
                                        ))}
                                        {/* Unused historical files */}
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
                    {allFiles.length === 0 &&
                        currentAttachments?.length === 0 &&
                        autoRetrievedAttachments.length === 0 &&
                        !linkedDriveFolder && (
                            <div className="flex flex-1 flex-column items-center justify-center text-center h-full">
                                <Icon name="file" size={8} className="color-weak mb-2" />
                                <p className="color-weak text-sm m-0">{c('collider_2025: Info')
                                    .t`No files available`}</p>
                            </div>
                        )}
                </div>

                {/* Only show context progress and explanation when not filtering */}
                {!filterMessage && (
                    <div>
                        {/* Knowledge Base Explanation */}
                        <div className="mb-4 p-3 knowledge-info-area rounded border border-weak">
                            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
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
