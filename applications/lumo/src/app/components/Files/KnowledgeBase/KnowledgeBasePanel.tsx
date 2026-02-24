import React, { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, useNotifications } from '@proton/components';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { DRIVE_SHORT_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useAutoRetrievedAttachments, useFileProcessing, useFilteredFiles } from '../../../hooks';
import type { DriveNode } from '../../../hooks/useDriveSDK';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectContextFilters, selectSpaceByIdOptional } from '../../../redux/selectors';
import { addContextFilter, removeContextFilter } from '../../../redux/slices/contextFilters';
import { deleteAttachment } from '../../../redux/slices/core/attachments';
import { handleFileAsync } from '../../../services/files';
import { SearchService } from '../../../services/search/searchService';
import { type Attachment, type Message, getProjectInfo } from '../../../types';
import type { DriveDocument } from '../../../types/documents';
import { getMimeTypeFromExtension } from '../../../util/filetypes';
import { DriveBrowser } from '../DriveBrowser';
import { KnowledgeBaseContextProgressBar } from './KnowledgeBaseContextProgressBar';
import { KnowledgeBaseFileItem } from './KnowledgeBaseFileItem';
import { KnowledgeBaseGuestDriveUpsell } from './KnowledgeBaseGuestDriveUpsell';

const MEDIUM_SCREEN_BREAK = 1024;

// ---------------------------------------------------------------------------
// Responsive breakpoint hook
// ---------------------------------------------------------------------------

const useMediumScreen = () => {
    const [isMediumScreen, setIsMediumScreen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= MEDIUM_SCREEN_BREAK;
        }
        return false;
    });

    useEffect(() => {
        const handleResize = () => setIsMediumScreen(window.innerWidth <= MEDIUM_SCREEN_BREAK);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMediumScreen;
};

// ---------------------------------------------------------------------------
// Section sub-components
// ---------------------------------------------------------------------------

interface FileViewHandler {
    (file: any, fullAttachment: any, e: React.MouseEvent): void;
}

interface FilteredFilesContentProps {
    allFiles: any[];
    contextFilters: any[];
    onView: FileViewHandler;
    onExclude: (file: any) => void;
    onInclude: (file: any) => void;
}

const FilteredFilesContent = ({
    allFiles,
    contextFilters,
    onView,
    onExclude,
    onInclude,
}: FilteredFilesContentProps) => {
    const autoRetrievedFiles = allFiles.filter((f) => f.autoRetrieved);
    const manualFiles = allFiles.filter((f) => !f.autoRetrieved);

    const isExcluded = (f: any) => {
        const filter = contextFilters.find((cf: any) => cf.messageId === f.messageId);
        return filter ? filter.excludedFiles.includes(f.filename) : false;
    };

    const activeAutoFiles = autoRetrievedFiles.filter((f) => !isExcluded(f));
    const excludedAutoFiles = autoRetrievedFiles.filter((f) => isExcluded(f));

    return (
        <>
            {autoRetrievedFiles.length > 0 && (
                <div className="mb-3 w-full p-4 bg-weak rounded border border-weak">
                    <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
                        <Icon name="folder-open" size={4} className="color-norm" />
                        {c('collider_2025: Info').t`Retrieved Project Knowledge`}
                    </h3>
                    <p className="text-xs color-weak mb-3">
                        {c('collider_2025: Info').t`Files automatically retrieved based on your question.`}
                    </p>

                    {activeAutoFiles.map((file) => (
                        <KnowledgeBaseFileItem
                            key={`${file.messageId}-${file.id}`}
                            file={file}
                            onView={onView}
                            isActive={true}
                            onExclude={() => onExclude(file)}
                        />
                    ))}

                    {excludedAutoFiles.length > 0 && (
                        <div className="mt-3 pt-3 border-top border-weak">
                            <h4 className="text-xs color-weak mb-2">
                                {c('collider_2025: Info').t`Removed from future questions`}
                            </h4>
                            {excludedAutoFiles.map((file) => (
                                <KnowledgeBaseFileItem
                                    key={`${file.messageId}-${file.id}`}
                                    file={file}
                                    onView={onView}
                                    isActive={false}
                                    onInclude={() => onInclude(file)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {manualFiles.length > 0 && (
                <div className="mb-6 w-full">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Icon name="file" size={4} />
                        {c('collider_2025: Info').t`Attached Files`} ({manualFiles.length})
                    </h3>
                    {manualFiles.map((file) => (
                        <KnowledgeBaseFileItem
                            key={`${file.messageId}-${file.id}`}
                            file={file}
                            onView={onView}
                            isActive={true}
                            readonly={true}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

interface RetrievedKnowledgeSectionProps {
    activeAutoRetrieved: any[];
    onView: FileViewHandler;
    onExclude: (file: any) => void;
}

const RetrievedKnowledgeSection = ({ activeAutoRetrieved, onView, onExclude }: RetrievedKnowledgeSectionProps) => (
    <div className="mb-3 w-full p-4 bg-weak rounded border border-weak">
        <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
            <Icon name="folder-open" size={4} className="color-norm" />
            {c('collider_2025: Info').t`Retrieved Project Knowledge`}
        </h3>

        {activeAutoRetrieved.length === 0 ? (
            <p className="text-xs color-weak mb-3">
                {c('collider_2025: Info').t`Relevant files will be automatically retrieved based on your questions.`}
            </p>
        ) : (
            <>
                <p className="text-xs color-weak mb-3">
                    {c('collider_2025: Info').t`Files automatically retrieved based on your questions:`}
                </p>
                {activeAutoRetrieved.map((attachment) => (
                    <KnowledgeBaseFileItem
                        key={attachment.id}
                        file={attachment}
                        onView={onView}
                        isActive={true}
                        onExclude={() => onExclude(attachment)}
                    />
                ))}
            </>
        )}
    </div>
);

interface ManualAttachmentsSectionProps {
    currentAttachments: Attachment[];
    activeHistoricalFiles: any[];
    onView: FileViewHandler;
    onViewFile?: (attachment: any) => void;
    onRemove: (id: string) => void;
    onExclude: (file: any) => void;
}

const ManualAttachmentsSection = ({
    currentAttachments,
    activeHistoricalFiles,
    onView,
    onViewFile,
    onRemove,
    onExclude,
}: ManualAttachmentsSectionProps) => {
    const nonAutoRetrievedCurrentAttachments = currentAttachments.filter((a) => !a.autoRetrieved);
    const totalManual = nonAutoRetrievedCurrentAttachments.length + activeHistoricalFiles.length;

    if (totalManual === 0) return null;

    return (
        <div className="mb-3 w-full p-4 bg-weak rounded border border-weak">
            <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
                <Icon name="paper-clip" size={4} className="color-norm" />
                {c('collider_2025: Info').t`Attached Files`}
                <span className="text-normal color-weak">{totalManual}</span>
            </h3>
            <p className="text-xs color-weak mb-3">
                {c('collider_2025: Info').t`Files you've added to this conversation.`}
            </p>

            {nonAutoRetrievedCurrentAttachments.map((attachment) => (
                <KnowledgeBaseFileItem
                    key={attachment.id}
                    file={attachment}
                    onView={(file, fullAttachment) => onViewFile && onViewFile(fullAttachment)}
                    onRemove={onRemove}
                    isActive={true}
                    showToggle={false}
                />
            ))}

            {activeHistoricalFiles.map((file) => (
                <KnowledgeBaseFileItem
                    key={`${file.messageId}-${file.id}`}
                    file={file}
                    onView={onView}
                    onExclude={() => onExclude(file)}
                    isActive={true}
                />
            ))}
        </div>
    );
};

interface ExcludedFilesSectionProps {
    excludedAutoRetrieved: any[];
    unusedHistoricalFiles: any[];
    onView: FileViewHandler;
    onInclude: (file: any) => void;
}

const ExcludedFilesSection = ({
    excludedAutoRetrieved,
    unusedHistoricalFiles,
    onView,
    onInclude,
}: ExcludedFilesSectionProps) => {
    const totalExcluded = excludedAutoRetrieved.length + unusedHistoricalFiles.length;
    if (totalExcluded === 0) return null;

    return (
        <div className="mb-4 w-full p-4 bg-weak rounded border border-weak opacity-70">
            <h3 className="text-sm text-bold mb-2 flex items-center gap-2">
                <Icon name="eye-slash" size={4} className="color-weak" />
                {c('collider_2025: Info').t`Excluded`}
                <span className="text-normal color-weak">{totalExcluded}</span>
            </h3>
            <p className="text-xs color-weak mb-3">
                {c('collider_2025: Info').t`These files won't be used for future questions.`}
            </p>
            <div className="space-y-2">
                {excludedAutoRetrieved.map((attachment) => (
                    <KnowledgeBaseFileItem
                        key={attachment.id}
                        file={attachment}
                        onView={onView}
                        isActive={false}
                        onInclude={() => onInclude(attachment)}
                    />
                ))}
                {unusedHistoricalFiles.map((file) => (
                    <KnowledgeBaseFileItem
                        key={`${file.messageId}-${file.id}`}
                        file={file}
                        onView={onView}
                        onInclude={() => onInclude(file)}
                        isActive={false}
                    />
                ))}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// FilesPanel
// ---------------------------------------------------------------------------

interface KnowledgeBasePanelProps {
    messageChain: Message[];
    filesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    isModal: boolean;
    onViewFile?: (attachment: any) => void;
    currentAttachments?: Attachment[];
    filterMessage?: Message;
    onClearFilter?: () => void;
    initialShowDriveBrowser?: boolean;
    spaceId?: string;
}

export const KnowledgeBasePanel = ({
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
}: KnowledgeBasePanelProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const contextFilters = useLumoSelector(selectContextFilters);
    const fileProcessingService = useFileProcessing();

    const [showDriveBrowser, setShowDriveBrowser] = useState(initialShowDriveBrowser);
    const [showKnowledgeExplanation, setShowKnowledgeExplanation] = useState(false);

    const { allFiles, activeHistoricalFiles, unusedHistoricalFiles } = useFilteredFiles(
        messageChain,
        currentAttachments,
        filterMessage,
        spaceId
    );

    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const { linkedDriveFolder } = getProjectInfo(space);

    const user = useLumoSelector((state) => state.user?.value);

    const { autoRetrievedAttachments, activeAutoRetrieved, excludedAutoRetrieved } =
        useAutoRetrievedAttachments(messageChain);

    const handleIncludeHistoricalFile = (file: any) => {
        dispatch(removeContextFilter({ messageId: file.messageId, filename: file.filename }));
    };

    const handleExcludeHistoricalFile = (file: any) => {
        dispatch(addContextFilter({ messageId: file.messageId, filename: file.filename }));
    };

    const handleDriveFileSelect = React.useCallback(
        async (file: DriveNode, content: Uint8Array<ArrayBuffer>) => {
            try {
                const detectedMimeType = getMimeTypeFromExtension(file.name);
                const mimeType = file.mediaType || detectedMimeType;
                const fileName = file.name;

                const fileBlob = new Blob([content], { type: mimeType });
                const fileObject = new File([fileBlob], fileName, {
                    type: mimeType,
                    lastModified: file.modifiedTime?.getTime() || Date.now(),
                });

                console.log(
                    `Processing downloaded Drive file: ${file.name} (${(content.length / 1024 / 1024).toFixed(2)} MB)`
                );
                const result = await dispatch(handleFileAsync(fileObject, messageChain, fileProcessingService));

                if (result.isDuplicate) {
                    createNotification({
                        text: c('collider_2025: Error').t`File already added: ${result.fileName}`,
                        type: 'warning',
                    });
                } else if (result.isUnsupported) {
                    createNotification({
                        text: c('collider_2025: Error').t`File format not supported: ${result.fileName}`,
                        type: 'error',
                    });
                } else if (!result.success && result.errorMessage) {
                    createNotification({
                        text: c('collider_2025: Error').t`Error processing ${result.fileName}: ${result.errorMessage}`,
                        type: 'error',
                    });
                } else {
                    createNotification({
                        text: c('collider_2025: Success').t`File added to knowledge base: ${result.fileName}`,
                        type: 'success',
                    });

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
    }, []);

    const handleFileClick: FileViewHandler = (file, fullAttachment, e) => {
        e.preventDefault();
        onViewFile?.(fullAttachment);
    };

    const isGuest = useIsGuest();
    const isMediumScreen = useMediumScreen();

    const panelClassName = clsx('files-panel h-full', {
        'w-full modal-files-panel': isModal,
        'w-1/2 pt-2 pr-4 pb-6': !isModal && isMediumScreen,
        'w-1/3 pt-2 pr-4 pb-6': !isModal && !isMediumScreen,
    });

    if (showDriveBrowser) {
        if (isGuest) {
            return (
                <KnowledgeBaseGuestDriveUpsell
                    filesContainerRef={filesContainerRef}
                    isModal={isModal}
                    isMediumScreen={isMediumScreen}
                    onBack={!initialShowDriveBrowser ? () => setShowDriveBrowser(false) : undefined}
                    onClose={onClose}
                />
            );
        }

        return (
            <div className={panelClassName} ref={filesContainerRef}>
                <div
                    className={clsx('w-full h-full relative', {
                        'rounded-none shadow-none': isModal,
                        'files-panel-content flex flex-column flex-nowrap bg-norm rounded-xl shadow-lifted': !isModal,
                    })}
                >
                    <DriveBrowser
                        onFileSelect={handleDriveFileSelect}
                        onError={handleDriveError}
                        onClose={onClose}
                        onBack={() => setShowDriveBrowser(false)}
                        autoRefreshInterval={0}
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

    const isEmpty =
        allFiles.length === 0 &&
        currentAttachments.length === 0 &&
        autoRetrievedAttachments.length === 0 &&
        !linkedDriveFolder;

    return (
        <div className={panelClassName} ref={filesContainerRef}>
            <div
                className={clsx(
                    'files-panel-content flex flex-column flex-nowrap w-full rounded-xl bg-norm shadow-lifted w-full h-full',
                    {
                        'p-4 bg-weak': !isModal,
                    }
                )}
            >
                {/* Header */}
                <div className="mb-4">
                    <div className="flex flex-row items-center justify-space-between mb-2">
                        <div className="flex flex-row flex-nowrap items-center gap-1">
                            <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                                <IcCross />
                            </Button>
                            <p className="m-0 text-lg text-bold">{c('collider_2025: Info').t`Chat knowledge`}</p>
                        </div>

                        {!linkedDriveFolder && (
                            <Button
                                size="medium"
                                shape="solid"
                                onClick={() => setShowDriveBrowser(true)}
                                className="shrink-0 bg-strong flex flex-row flex-nowrap items-center"
                                title={c('collider_2025: Action').t`Browse ${DRIVE_SHORT_APP_NAME}`}
                            >
                                <IcBrandProtonDrive size={4} />
                                <span className="text-sm ml-2 hidden md:flex">
                                    {c('collider_2025: Action').t`Browse ${DRIVE_SHORT_APP_NAME}`}
                                </span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter chip */}
                {filterMessage && onClearFilter && (
                    <div className="mb-4 flex flex-row items-center gap-2">
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
                    </div>
                )}

                {/* File list */}
                <div className="flex-1 flex-row overflow-y-auto" style={{ minHeight: '35vh' }}>
                    {filterMessage ? (
                        <FilteredFilesContent
                            allFiles={allFiles}
                            contextFilters={contextFilters}
                            onView={handleFileClick}
                            onExclude={handleExcludeHistoricalFile}
                            onInclude={handleIncludeHistoricalFile}
                        />
                    ) : (
                        <>
                            {(linkedDriveFolder || autoRetrievedAttachments.length > 0) && (
                                <RetrievedKnowledgeSection
                                    activeAutoRetrieved={activeAutoRetrieved}
                                    onView={handleFileClick}
                                    onExclude={handleExcludeHistoricalFile}
                                />
                            )}

                            <ManualAttachmentsSection
                                currentAttachments={currentAttachments}
                                activeHistoricalFiles={activeHistoricalFiles}
                                onView={handleFileClick}
                                onViewFile={onViewFile}
                                onRemove={(id) => dispatch(deleteAttachment(id))}
                                onExclude={handleExcludeHistoricalFile}
                            />

                            <ExcludedFilesSection
                                excludedAutoRetrieved={excludedAutoRetrieved}
                                unusedHistoricalFiles={unusedHistoricalFiles}
                                onView={handleFileClick}
                                onInclude={handleIncludeHistoricalFile}
                            />
                        </>
                    )}

                    {isEmpty && (
                        <div className="flex flex-1 flex-column items-center justify-center text-center h-full">
                            <Icon name="file" size={8} className="color-weak mb-2" />
                            <p className="color-weak text-sm m-0">{c('collider_2025: Info').t`No files available`}</p>
                        </div>
                    )}
                </div>

                {/* Context capacity info — hidden in filter mode */}
                {!filterMessage && (
                    <div>
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

                        <KnowledgeBaseContextProgressBar
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
