import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import FileIcon from '@proton/components/components/fileIcon/FileIcon';

import { ENABLE_FOUNDATION_SEARCH } from '../../../../config/search';
import { useLumoUserSettings } from '../../../../hooks';
import { useDriveFolderIndexing } from '../../../../hooks/useDriveFolderIndexing';
import { useMessageSearch } from '../../../../hooks/useMessageSearch';
import { DbApi } from '../../../../indexedDb/db';
import { useLumoSelector } from '../../../../redux/hooks';
import { selectConversations, selectMessages } from '../../../../redux/selectors';
import { selectSpaceMap } from '../../../../redux/slices/core/spaces';
import { SearchService } from '../../../../services/search/searchService';
import type { SearchServiceStatus } from '../../../../services/search/types';
import type { Conversation, Message, SpaceId } from '../../../../types';
import type { DriveDocument } from '../../../../types/documents';
import { IndexingStatusBanner } from '../../../components/Files/DriveBrowser/IndexingStatusBanner';
import { SearchIndexManagement } from './SearchIndexManagement';
import { SearchIndexPrivacy } from './SearchIndexPrivacy';
import { SearchIndexStats } from './SearchIndexStats';
import { SearchInspectDetail } from './SearchInspectDetail';
import { SearchInspectList } from './SearchInspectList';

const SettingsSectionItem = ({
    icon,
    text,
    subtext,
    button,
    status,
}: {
    icon: string;
    text: string | React.ReactNode;
    subtext?: string | React.ReactNode;
    button?: React.ReactNode;
    status?: React.ReactNode;
}) => {
    return (
        <div className="flex flex-row flex-nowrap gap-4 items-start p-2">
            <Avatar color="weak" className="settings-section-icon">
                <Icon className="shrink-0 color-weak" name={icon as any} size={5} />
            </Avatar>
            <div className="flex-1 flex flex-column *:min-size-auto sm:flex-row flex-nowrap gap-2">
                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                    {typeof text === 'string' ? <span className="text-semibold">{text}</span> : text}
                    {subtext && <span className="color-weak">{subtext}</span>}
                    {status && <div className="mt-2">{status}</div>}
                </div>
                <div className="shrink-0 my-auto">{button}</div>
            </div>
        </div>
    );
};

export const SearchSettingsPanel = () => {
    const [user] = useUser();
    const conversations = useLumoSelector(selectConversations);
    const messages = useLumoSelector(selectMessages);
    const spaceMap = useLumoSelector(selectSpaceMap);
    const userId = user?.ID;
    const { indexingStatus: messageIndexingStatus } = useMessageSearch();
    const { lumoUserSettings } = useLumoUserSettings();
    const {
        indexedFolders: driveIndexedFolders,
        rehydrateFolders,
        isIndexing: isDriveIndexing,
        indexingStatus: driveIndexingStatus,
    } = useDriveFolderIndexing();
    const [isIndexing, setIsIndexing] = useState(false);
    const [foundationStatus, setFoundationStatus] = useState<SearchServiceStatus | undefined>();
    const [statusCheckCount, setStatusCheckCount] = useState(0);
    const [viewMode, setViewMode] = useState<'stats' | 'inspectList' | 'inspectDetail'>('stats');
    const [inspectDocs, setInspectDocs] = useState<DriveDocument[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<DriveDocument | null>(null);

    useEffect(() => {
        if (!ENABLE_FOUNDATION_SEARCH || !userId) return;

        const checkStatus = async () => {
            try {
                const service = SearchService.get(userId);
                if (service) {
                    const status = await service.status();
                    setFoundationStatus(status);
                }
            } catch (error) {
                console.error('[SearchSettings] Failed to get status', error);
            }
        };

        void checkStatus();
        const interval = setInterval(() => {
            void checkStatus();
        }, 2000);
        return () => clearInterval(interval);
    }, [userId, statusCheckCount]);

    const conversationCount = Object.keys(conversations).length;
    const messageCount = Object.keys(messages).length;

    // Get valid space IDs to filter out folders linked to deleted spaces
    const validSpaceIds = new Set<SpaceId>(Object.keys(spaceMap) as SpaceId[]);

    const allIndexedFolders = driveIndexedFolders ?? lumoUserSettings.indexedDriveFolders ?? [];
    // Filter to only include folders whose space still exists (or have no spaceId)
    const indexedFolders = allIndexedFolders.filter((f) => !f.spaceId || validSpaceIds.has(f.spaceId as SpaceId));
    const totalIndexedDocuments = indexedFolders.reduce((sum, folder) => sum + (folder.documentCount || 0), 0);
    const indexedFoldersCount = indexedFolders.filter((f) => f.isActive).length;
    const hasIndexEntries = !!foundationStatus?.hasEntries || (foundationStatus?.entryCount ?? 0) > 0;

    /* eslint-disable no-nested-ternary */
    const displayDriveDocs =
        hasIndexEntries && foundationStatus?.driveDocuments && foundationStatus.driveDocuments > 0
            ? foundationStatus.driveDocuments
            : hasIndexEntries
              ? totalIndexedDocuments
              : 0;
    /* eslint-disable no-nested-ternary */
    const displayFolders =
        hasIndexEntries && foundationStatus?.indexedFolders && foundationStatus.indexedFolders > 0
            ? foundationStatus.indexedFolders
            : hasIndexEntries
              ? indexedFoldersCount
              : 0;
    const progressColor = (count: number) => (count > 0 ? 'var(--text-success)' : 'var(--text-weak)');

    const handleReindex = useCallback(async () => {
        if (isIndexing || isDriveIndexing || !userId) return;

        setIsIndexing(true);

        try {
            const db = new DbApi(userId);
            await db.clearAllSearchBlobs();

            await new Promise((resolve) => setTimeout(resolve, 100));

            const searchService = SearchService.get(userId);
            if (!searchService) {
                console.error('[SearchSettings] Search service not available');
                return;
            }

            const conversationList = Object.values(conversations) as Conversation[];
            const conversationsWithMessages: Record<string, any> = {};
            for (const conversation of conversationList) {
                const conversationMessages = Object.values(messages).filter(
                    (msg: Message) => msg.conversationId === conversation.id
                ) as Message[];

                conversationsWithMessages[conversation.id] = {
                    ...conversation,
                    messages: conversationMessages,
                };
            }

            try {
                await searchService.populateEngine(conversationsWithMessages);
            } catch (error) {
                console.error('[SearchSettings] Conversation populate failed, continuing to Drive reindex:', error);
            }

            // Get valid space IDs to skip folders linked to deleted spaces
            const validSpaceIds = new Set<SpaceId>(Object.keys(spaceMap) as SpaceId[]);

            console.log('[SearchSettings] Reindex Drive - starting rehydrate');
            const rehydratedCount = await rehydrateFolders(validSpaceIds);
            if (rehydratedCount === 0) {
                console.warn('[SearchSettings] Reindex Drive - no folders rehydrated; link or relink a Drive folder');
            } else {
                console.log('[SearchSettings] Reindex Drive - finished rehydrate; folders processed:', rehydratedCount);
            }
            setStatusCheckCount((prev) => prev + 1);
        } catch (error) {
            console.error('[SearchSettings] Re-indexing failed:', error);
        } finally {
            setIsIndexing(false);
        }
    }, [conversations, messages, isIndexing, isDriveIndexing, userId, rehydrateFolders, spaceMap]);

    const handleClearIndex = useCallback(async () => {
        if (!userId) return;

        if (
            !window.confirm(
                c('Confirmation')
                    .t`Are you sure you want to clear the search index? You will need to re-index to search again.`
            )
        ) {
            return;
        }

        try {
            const db = new DbApi(userId);
            await db.clearAllSearchBlobs();
            setStatusCheckCount((prev) => prev + 1);
        } catch (error) {
            console.error('[SearchSettings] Failed to clear index:', error);
        }
    }, [userId]);

    const formatBytes = (bytes?: number) => {
        if (!bytes || bytes <= 0) return c('Info').t`0 MB`;
        const mb = bytes / (1024 * 1024);
        if (mb < 0.1) {
            const kb = bytes / 1024;
            return `${kb.toFixed(1)} KB`;
        }
        return `${mb.toFixed(2)} MB`;
    };

    const handleInspect = async () => {
        if (!userId) return;
        try {
            const service = SearchService.get(userId);
            const docs = await service.getDriveDocuments();
            setInspectDocs(docs);
            setSelectedDoc(null);
            setViewMode('inspectList');
        } catch (error) {
            console.error('[SearchSettings] Failed to inspect index', error);
            setInspectDocs([]);
            setSelectedDoc(null);
            setViewMode('inspectList');
        }
    };

    // Inspect detail
    if (viewMode === 'inspectDetail' && selectedDoc) {
        return (
            <SearchInspectDetail
                doc={selectedDoc}
                formatBytes={formatBytes}
                onBack={() => setViewMode('inspectList')}
            />
        );
    }

    // Inspect list
    if (viewMode === 'inspectList') {
        return (
            <SearchInspectList
                displayDriveDocs={displayDriveDocs}
                docs={inspectDocs}
                formatBytes={formatBytes}
                onBack={() => setViewMode('stats')}
                onSelect={(doc) => {
                    setSelectedDoc(doc);
                    setViewMode('inspectDetail');
                }}
            />
        );
    }

    // Inspect detail
    if (viewMode === 'inspectDetail' && selectedDoc) {
        const doc = selectedDoc;
        /* eslint-disable no-nested-ternary */
        const sizeText =
            doc.size && doc.size > 0
                ? formatBytes(doc.size)
                : doc.content
                  ? formatBytes(new TextEncoder().encode(doc.content).byteLength)
                  : c('Info').t`Unknown size`;
        return (
            <div className="flex flex-column gap-3">
                <div className="flex items-center gap-2">
                    <Button shape="ghost" size="small" onClick={() => setViewMode('inspectList')}>
                        <Icon name="arrow-left" size={4} className="mr-1" />
                        {c('Action').t`Back to Drive documents`}
                    </Button>
                    <span className="text-semibold truncate">{doc.name}</span>
                </div>

                <div
                    className="p-3 rounded border bg-weak flex gap-3 items-start"
                    style={{ borderColor: 'var(--border-weak)' }}
                >
                    <FileIcon mimeType={doc.mimeType || 'application/octet-stream'} size={5} />
                    <div className="flex-1 min-w-0">
                        <div className="text-semibold text-lg truncate mb-2">{doc.name}</div>
                        <div
                            className="grid"
                            style={{ gridTemplateColumns: 'max-content 1fr', rowGap: '0.35rem', columnGap: '0.75rem' }}
                        >
                            <span className="text-sm color-weak">{c('Info').t`Folder:`}</span>
                            <span className="text-sm truncate">{doc.folderPath || doc.folderId || '—'}</span>

                            <span className="text-sm color-weak">{c('Info').t`Space:`}</span>
                            <span className="text-sm truncate">{doc.spaceId || '—'}</span>

                            <span className="text-sm color-weak">{c('Info').t`MIME:`}</span>
                            <span className="text-sm">{doc.mimeType || c('Info').t`Unknown`}</span>

                            <span className="text-sm color-weak">{c('Info').t`Size:`}</span>
                            <span className="text-sm">{sizeText}</span>

                            <span className="text-sm color-weak">{c('Info').t`Modified:`}</span>
                            <span className="text-sm">
                                {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleString() : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {doc.content && (
                    <div
                        className="p-3 border rounded bg-weak"
                        style={{ borderColor: 'var(--border-weak)', maxHeight: 400, overflowY: 'auto' }}
                    >
                        <div className="text-xs color-weak mb-2">
                            {c('Info').t`Indexed content (first 2000 chars):`}
                        </div>
                        <pre className="text-sm whitespace-pre-wrap break-words m-0" style={{ lineHeight: 1.4 }}>
                            {doc.content.slice(0, 2000)}
                            {doc.content.length > 2000 ? '…' : ''}
                        </pre>
                    </div>
                )}
            </div>
        );
    }

    // Stats view (default)
    return (
        <div className="flex flex-column gap-4 flex-nowrap overflow-y-auto *:min-size-auto">
            <SettingsSectionItem
                icon="list-bullets"
                text={c('Title').t`Index Statistics`}
                subtext={
                    <SearchIndexStats
                        foundationStatus={foundationStatus}
                        conversationCount={conversationCount}
                        messageCount={messageCount}
                        displayFolders={displayFolders}
                        displayDriveDocs={displayDriveDocs}
                        progressColor={progressColor}
                        formatBytes={formatBytes}
                        onInspect={handleInspect}
                        userId={userId}
                        enableFoundationSearch={ENABLE_FOUNDATION_SEARCH}
                    />
                }
            />

            <SettingsSectionItem
                icon="arrows-rotate"
                text={c('Title').t`Index Management`}
                subtext={c('Description').t`Manually trigger indexing or clear the search index`}
                button={
                    <SearchIndexManagement
                        onReindex={handleReindex}
                        onClear={handleClearIndex}
                        disabled={isIndexing || isDriveIndexing}
                    />
                }
                status={
                    // Show indexing progress when active (state is now shared via context)
                    isDriveIndexing && driveIndexingStatus ? (
                        <IndexingStatusBanner
                            indexingStatus={driveIndexingStatus}
                            isIndexing={isDriveIndexing}
                            inline
                        />
                    ) : null
                }
            />

            <SettingsSectionItem
                icon="info-circle"
                text={c('Title').t`Index privacy`}
                subtext={<SearchIndexPrivacy enableFoundationSearch={ENABLE_FOUNDATION_SEARCH} />}
            />

            {messageIndexingStatus.error && (
                <div className="p-3 bg-danger-weak rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name="exclamation-circle" size={4} className="color-danger" />
                        <span className="text-semibold color-danger">{c('Error').t`Indexing Error`}</span>
                    </div>
                    <span className="text-sm color-weak">{messageIndexingStatus.error}</span>
                </div>
            )}

            {!foundationStatus?.hasEntries && conversationCount > 0 && (
                <div className="p-3 bg-warning-weak rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name="exclamation-triangle-filled" size={4} className="color-warning" />
                        <span className="text-semibold color-warning">{c('Warning').t`Index Not Created`}</span>
                    </div>
                    <div className="text-sm color-weak">
                        <p className="mb-2">
                            {c('Info')
                                .t`You have ${conversationCount} conversations but no search index has been created yet.`}
                        </p>
                        <p>
                            <strong>{c('Info').t`To fix:`}</strong> Click "Index Now" to create the search index for all
                            your conversations.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
