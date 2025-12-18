import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Icon } from '@proton/components';

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
import { SearchInspectList, type GroupedDocument } from './SearchInspectList';

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
    const [selectedGrouped, setSelectedGrouped] = useState<GroupedDocument | null>(null);

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
            setSelectedGrouped(null);
            setViewMode('inspectList');
        } catch (error) {
            console.error('[SearchSettings] Failed to inspect index', error);
            setInspectDocs([]);
            setSelectedGrouped(null);
            setViewMode('inspectList');
        }
    };

    // Inspect detail
    if (viewMode === 'inspectDetail' && selectedGrouped) {
        return (
            <SearchInspectDetail
                grouped={selectedGrouped}
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
                onSelect={(grouped) => {
                    setSelectedGrouped(grouped);
                    setViewMode('inspectDetail');
                }}
            />
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
        </div>
    );
};
