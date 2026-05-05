import React, { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useNotifications } from '@proton/components';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronUp } from '@proton/icons/icons/IcChevronUp';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcFile } from '@proton/icons/icons/IcFile';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { DRIVE_SHORT_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useAutoRetrievedAttachments, useFilteredFiles } from '../../../hooks';
import type { DriveNode } from '../../../hooks/useDriveSDK';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectContextFilters, selectSpaceByIdOptional } from '../../../redux/selectors';
import { addContextFilter, removeContextFilter } from '../../../redux/slices/contextFilters';
import { locallyDeleteAttachmentFromLocalRequest } from '../../../redux/slices/core/attachments';
import { type Attachment, type Message, getProjectInfo } from '../../../types';
import { getMimeTypeFromExtension } from '../../../util/filetypes';
import { useExcelSheetSelection } from '../../Composer/ExcelSheetSelectionModal';
import { useFileHandling } from '../../Composer/hooks/useFileHandling';
import { useNativeComposerVisibilityApi } from '../../Composer/hooks/useNativeComposerVisibilityApi';
import { KnowledgeBaseGuestDriveUpsell } from '../../Guest/KnowledgeBaseGuestDriveUpsell';
import { FilePreviewPanel } from '../Common/FilePreviewPanel';
import { DriveBrowser } from '../DriveBrowser';
import { KnowledgeBaseContextProgressBar } from './KnowledgeBaseContextProgressBar';
import { KnowledgeBaseFileItem } from './KnowledgeBaseFileItem';
import { EmptyStateWithUpload } from './components';

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
                <div className="mb-4 w-full">
                    <h3 className="text-sm text-bold mb-1">
                        {c('collider_2025: Info').t`Project knowledge`}{' '}
                        <span className="color-weak text-normal">{activeAutoFiles.length}</span>
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
                        <div className="mt-3">
                            <h4 className="text-xs text-bold color-weak mb-2">
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
                        <IcFile size={4} />
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
    <div className="mb-4 w-full">
        <h3 className="text-sm text-bold mb-1">
            {c('collider_2025: Info').t`Project knowledge`}{' '}
            <span className="color-weak text-normal">{activeAutoRetrieved.length}</span>
        </h3>

        {activeAutoRetrieved.length === 0 ? (
            <p className="text-xs color-weak mb-3">
                {c('collider_2025: Info').t`Relevant files will be automatically retrieved based on your questions.`}
            </p>
        ) : (
            <>
                <p className="text-xs color-weak mb-3">
                    {c('collider_2025: Info').t`Files automatically retrieved based on your questions.`}
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
        <div className="mb-4 w-full">
            <h3 className="text-sm text-bold mb-1">
                {c('collider_2025: Info').t`Attached files`}{' '}
                <span className="color-weak text-normal">{totalManual}</span>
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
        <div className="mb-4 w-full">
            <h3 className="text-sm text-bold mb-1">
                {c('collider_2025: Info').t`Excluded`} <span className="color-weak text-normal">{totalExcluded}</span>
            </h3>
            <p className="text-xs color-weak mb-3">
                {c('collider_2025: Info').t`These files won't be used for future questions.`}
            </p>
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
    useNativeComposerVisibilityApi({ isBlocking: true });

    const [showDriveBrowser, setShowDriveBrowser] = useState(initialShowDriveBrowser);
    const [showKnowledgeExplanation, setShowKnowledgeExplanation] = useState(false);
    const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
    const { requestSheetSelection: handleSelectExcelSheets, modal: excelSheetSelectionModal } =
        useExcelSheetSelection();

    const { handleLocalFileProcessing } = useFileHandling({
        messageChain,
        spaceId,
        onSelectExcelSheets: handleSelectExcelSheets,
        notifyOnSuccess: true,
    });

    const { allFiles, activeHistoricalFiles, unusedHistoricalFiles } = useFilteredFiles(
        messageChain,
        currentAttachments,
        filterMessage,
        spaceId
    );

    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const { linkedDriveFolder } = getProjectInfo(space);

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
                const mimeType = file.mediaType || getMimeTypeFromExtension(file.name);
                const fileObject = new File([new Blob([content], { type: mimeType })], file.name, {
                    type: mimeType,
                    lastModified: file.modifiedTime?.getTime() || Date.now(),
                });

                console.log(
                    `Processing downloaded Drive file: ${file.name} (${(content.length / 1024 / 1024).toFixed(2)} MB)`
                );

                await handleLocalFileProcessing(fileObject);
            } catch (error) {
                console.error('Failed to process downloaded Drive file:', error);
                createNotification({
                    text: c('collider_2025: Error').t`Failed to process ${DRIVE_SHORT_APP_NAME} file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [createNotification, handleLocalFileProcessing]
    );

    const handleDriveError = React.useCallback((error: Error) => {
        console.error('Drive browser error:', error);
    }, []);

    const handleFileClick: FileViewHandler = (file, fullAttachment, e) => {
        e.preventDefault();
        if (fullAttachment) {
            setPreviewFile(fullAttachment);
        }
    };

    const isGuest = useIsGuest();
    const isMediumScreen = useMediumScreen();

    const panelClassName = clsx('files-panel h-full', {
        'w-full modal-files-panel': isModal,
        'w-1/2 pt-2 pr-4 pb-6': !isModal && isMediumScreen,
        'w-1/3 pt-2 pr-4 pb-6': !isModal && !isMediumScreen,
    });

    if (previewFile) {
        return (
            <>
                <div className={panelClassName} ref={filesContainerRef}>
                    <div
                        className={clsx('files-panel-content w-full h-full', {
                            'bg-weak rounded-xl shadow-lifted': !isModal,
                        })}
                    >
                        <FilePreviewPanel
                            attachment={previewFile}
                            onBack={() => setPreviewFile(null)}
                            onClose={onClose}
                        />
                    </div>
                </div>
                {excelSheetSelectionModal}
            </>
        );
    }

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
            <>
                <div className={panelClassName} ref={filesContainerRef}>
                    <div
                        className={clsx('w-full h-full relative', {
                            'rounded-none shadow-none': isModal,
                            'files-panel-content flex flex-column flex-nowrap bg-norm rounded-xl shadow-lifted':
                                !isModal,
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
                {excelSheetSelectionModal}
            </>
        );
    }

    const isEmpty =
        allFiles.length === 0 &&
        currentAttachments.length === 0 &&
        autoRetrievedAttachments.length === 0 &&
        !linkedDriveFolder;

    const IndicatorIcon = showKnowledgeExplanation ? IcChevronUp : IcChevronDown;

    if (isEmpty) {
        return (
            <div className={panelClassName} ref={filesContainerRef}>
                <EmptyStateWithUpload
                    messageChain={messageChain}
                    onShowDriveBrowser={() => setShowDriveBrowser(true)}
                    spaceId={spaceId}
                />
            </div>
        );
    }

    return (
        <>
            <div className={panelClassName} ref={filesContainerRef}>
                <div
                    className={clsx('files-panel-content flex flex-column flex-nowrap w-full h-full p-4', {
                        'bg-weak rounded-xl shadow-lifted': !isModal,
                    })}
                >
                    {/* Header */}
                    <div className="shrink-0 mb-4">
                        <div className="flex flex-row items-center justify-space-between">
                            <div className="flex flex-row flex-nowrap items-center gap-1">
                                <p className="m-0 text-lg text-bold">
                                    {c('collider_2025: Info').t`All files in this chat`}
                                </p>
                            </div>

                            {!linkedDriveFolder && (
                                <Button
                                    size="small"
                                    shape="outline"
                                    onClick={() => setShowDriveBrowser(true)}
                                    className="shrink-0 flex flex-row flex-nowrap items-center gap-2"
                                    title={c('collider_2025: KBActionTitle').t`Add from ${DRIVE_SHORT_APP_NAME}`}
                                >
                                    <IcBrandProtonDrive size={4} />
                                    <span className="text-sm">
                                        {c('collider_2025: KBAction').t`Add from ${DRIVE_SHORT_APP_NAME}`}
                                    </span>
                                </Button>
                            )}

                            <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                                <IcCross size={4} />
                            </Button>
                        </div>
                    </div>

                    {/* Filter chip */}
                    {filterMessage && onClearFilter && (
                        <div className="shrink-0 mb-4 flex flex-row items-center gap-2">
                            <Button
                                size="small"
                                shape="solid"
                                icon={true}
                                onClick={onClearFilter}
                                className="text-info hover:text-info-dark p-2 -mr-1 shrink-0 inline-flex items-center gap-2"
                                title={c('collider_2025: Info').t`Show all files`}
                            >
                                <IcCross size={3} />
                                <span className="text-sm">{c('collider_2025: Info').t`Remove message filter`}</span>
                            </Button>
                        </div>
                    )}

                    {/* File list */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
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
                                    onRemove={(id) => dispatch(locallyDeleteAttachmentFromLocalRequest(id))}
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
                                <IcFile size={8} className="color-weak mb-2" />
                                <p className="color-weak text-sm m-0">{c('collider_2025: Info')
                                    .t`No files available`}</p>
                            </div>
                        )}
                    </div>

                    {/* Context capacity info — pinned to bottom, hidden in filter mode */}
                    {!filterMessage && (
                        <div
                            className="shrink-0 mt-2 border border-weak rounded-lg overflow-hidden"
                            style={{ height: showKnowledgeExplanation ? '8.75rem' : '5rem' }}
                        >
                            <button
                                type="button"
                                className="flex flex-row items-center gap-2 cursor-pointer p-3"
                                onClick={() => setShowKnowledgeExplanation(!showKnowledgeExplanation)}
                            >
                                <IcInfoCircle className="shrink-0 color-weak" />
                                <h4 className="m-0 text-sm text-bold flex-1">
                                    {c('collider_2025: Info').t`File capacity for this conversation`}
                                </h4>
                                <IndicatorIcon size={4} className="color-weak shrink-0" />
                            </button>

                            {showKnowledgeExplanation && (
                                <p className="m-0 text-xs color-weak px-3 pb-2">
                                    {c('collider_2025: Info')
                                        .t`For each conversation, ${LUMO_SHORT_APP_NAME} has the capacity to process a limited amount of information. The progress bar shows how much capacity your current files are using.`}
                                </p>
                            )}

                            <div className="px-3 pb-3">
                                <KnowledgeBaseContextProgressBar
                                    messageChain={messageChain}
                                    contextFilters={contextFilters}
                                    currentAttachments={currentAttachments}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {excelSheetSelectionModal}
        </>
    );
};
