import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/index';

import { ENABLE_FOUNDATION_SEARCH } from '../../../../config/search';
import { useDriveFolderIndexing } from '../../../../hooks/useDriveFolderIndexing';
import { useLumoUserSettings } from '../../../../hooks';
import { useLumoSelector } from '../../../../redux/hooks';
import { selectSpaceMap } from '../../../../redux/slices/core/spaces';
import { SearchService } from '../../../../services/search/searchService';
import type { SearchServiceStatus } from '../../../../services/search/types';
import type { SpaceId } from '../../../../types';
import type { DriveDocument } from '../../../../types/documents';
import { SearchIndexStats } from './SearchIndexStats';
import { SearchInspectDetail } from './SearchInspectDetail';
import { SearchInspectList, type GroupedDocument } from './SearchInspectList';

interface SearchIndexDebugModalProps {
    open: boolean;
    onClose: () => void;
}

export const SearchIndexDebugModal = ({ open, onClose }: SearchIndexDebugModalProps) => {
    const [user] = useUser();
    const userId = user?.ID;
    const spaceMap = useLumoSelector(selectSpaceMap);
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const { indexedFolders: driveIndexedFolders } = useDriveFolderIndexing();

    const [foundationStatus, setFoundationStatus] = useState<SearchServiceStatus | undefined>();
    const [viewMode, setViewMode] = useState<'stats' | 'inspectList' | 'inspectDetail'>('stats');
    const [inspectDocs, setInspectDocs] = useState<DriveDocument[]>([]);
    const [selectedGrouped, setSelectedGrouped] = useState<GroupedDocument | null>(null);
    const [orphanedDocCount, setOrphanedDocCount] = useState<number>(0);
    const [orphanedChunkCount, setOrphanedChunkCount] = useState<number>(0);
    const [orphanedSpaceIds, setOrphanedSpaceIds] = useState<string[]>([]);
    const [isCleaningUp, setIsCleaningUp] = useState(false);

    // Get valid space IDs - must be defined before useEffect that uses it
    const validSpaceIds = useMemo(() => new Set<SpaceId>(Object.keys(spaceMap) as SpaceId[]), [spaceMap]);
    const allIndexedFolders = driveIndexedFolders ?? lumoUserSettings.indexedDriveFolders ?? [];
    const indexedFolders = allIndexedFolders.filter((f) => !f.spaceId || validSpaceIds.has(f.spaceId as SpaceId));
    const totalIndexedDocuments = indexedFolders.reduce((sum, folder) => sum + (folder.documentCount || 0), 0);
    const indexedFoldersCount = indexedFolders.filter((f) => f.isActive).length;
    const hasIndexEntries = !!foundationStatus?.hasEntries || (foundationStatus?.entryCount ?? 0) > 0;

    useEffect(() => {
        if (!open || !ENABLE_FOUNDATION_SEARCH || !userId) return;

        const checkStatus = async () => {
            try {
                const service = SearchService.get(userId);
                if (service) {
                    const status = await service.status();
                    setFoundationStatus(status);

                    // Check for orphaned documents (docs referencing deleted spaces)
                    const orphaned = service.getOrphanedDocuments(validSpaceIds);
                    const orphanSpaceList = Array.from(orphaned.bySpace.keys());
                    setOrphanedSpaceIds(orphanSpaceList);
                    setOrphanedDocCount(orphaned.totalDocs);
                    setOrphanedChunkCount(orphaned.totalChunks);

                    if (orphaned.totalDocs > 0) {
                        console.warn('[SearchDebug] Found orphaned documents:', {
                            uniqueDocs: orphaned.totalDocs,
                            chunks: orphaned.totalChunks,
                            spaceIds: orphanSpaceList,
                            validSpaceIds: Array.from(validSpaceIds),
                        });
                    }
                }
            } catch (error) {
                console.error('[SearchDebug] Failed to get status', error);
            }
        };

        void checkStatus();
        const interval = setInterval(checkStatus, 2000);
        return () => clearInterval(interval);
    }, [open, userId, validSpaceIds]);

    /* eslint-disable no-nested-ternary */
    const displayDriveDocs =
        hasIndexEntries && foundationStatus?.driveDocuments && foundationStatus.driveDocuments > 0
            ? foundationStatus.driveDocuments
            : hasIndexEntries
              ? totalIndexedDocuments
              : 0;
    const displayFolders =
        hasIndexEntries && foundationStatus?.indexedFolders && foundationStatus.indexedFolders > 0
            ? foundationStatus.indexedFolders
            : hasIndexEntries
              ? indexedFoldersCount
              : 0;
    /* eslint-enable no-nested-ternary */

    const progressColor = (count: number) => (count > 0 ? 'var(--text-success)' : 'var(--text-weak)');

    const formatBytes = (bytes?: number) => {
        if (!bytes || bytes <= 0) return c('Info').t`0 MB`;
        const mb = bytes / (1024 * 1024);
        if (mb < 0.1) {
            const kb = bytes / 1024;
            return `${kb.toFixed(1)} KB`;
        }
        return `${mb.toFixed(2)} MB`;
    };

    const handleInspect = useCallback(async () => {
        if (!userId) return;
        try {
            const service = SearchService.get(userId);
            const docs = await service.getDriveDocuments();
            setInspectDocs(docs);
            setSelectedGrouped(null);
            setViewMode('inspectList');
        } catch (error) {
            console.error('[SearchDebug] Failed to inspect index', error);
            setInspectDocs([]);
            setSelectedGrouped(null);
            setViewMode('inspectList');
        }
    }, [userId]);

    const handleCleanupOrphaned = useCallback(async () => {
        if (!userId || isCleaningUp) return;

        setIsCleaningUp(true);
        try {
            const service = SearchService.get(userId);

            // Clean up orphaned documents from search index
            const cleanedSpaceIds = await service.cleanupOrphanedDocuments(validSpaceIds);

            if (cleanedSpaceIds.length > 0) {
                // Also clean up indexedDriveFolders in user settings
                const currentFolders = allIndexedFolders;
                const cleanedSpaceIdSet = new Set(cleanedSpaceIds);
                const updatedFolders = currentFolders.filter(
                    (folder) => !folder.spaceId || !cleanedSpaceIdSet.has(folder.spaceId)
                );

                if (updatedFolders.length !== currentFolders.length) {
                    console.log('[SearchDebug] Removing orphaned folders from settings:', {
                        before: currentFolders.length,
                        after: updatedFolders.length,
                        removed: currentFolders.length - updatedFolders.length,
                    });
                    updateSettings({
                        indexedDriveFolders: updatedFolders,
                        _autoSave: true,
                    });
                }
            }

            // Reset orphaned state
            setOrphanedDocCount(0);
            setOrphanedChunkCount(0);
            setOrphanedSpaceIds([]);

            console.log('[SearchDebug] Cleanup complete, removed data for spaces:', cleanedSpaceIds);
        } catch (error) {
            console.error('[SearchDebug] Failed to cleanup orphaned documents', error);
        } finally {
            setIsCleaningUp(false);
        }
    }, [userId, isCleaningUp, validSpaceIds, allIndexedFolders, updateSettings]);

    const handleClose = () => {
        setViewMode('stats');
        setSelectedGrouped(null);
        onClose();
    };

    const renderContent = () => {
        if (viewMode === 'inspectDetail' && selectedGrouped) {
            return (
                <SearchInspectDetail
                    grouped={selectedGrouped}
                    formatBytes={formatBytes}
                    onBack={() => setViewMode('inspectList')}
                />
            );
        }

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
            <div className="flex flex-column gap-4">
                <SearchIndexStats
                    foundationStatus={foundationStatus}
                    conversationCount={0}
                    messageCount={0}
                    displayFolders={displayFolders}
                    displayDriveDocs={displayDriveDocs}
                    progressColor={progressColor}
                    formatBytes={formatBytes}
                    onInspect={handleInspect}
                    userId={userId}
                    enableFoundationSearch={ENABLE_FOUNDATION_SEARCH}
                />

                {/* Orphaned Documents Warning */}
                {orphanedDocCount > 0 && (
                    <div className="p-3 bg-danger rounded">
                        <h4 className="text-sm text-semibold mb-2" style={{ color: 'var(--text-invert)' }}>
                            ⚠️ {c('Title').t`Orphaned Documents Detected`}
                        </h4>
                        <div className="text-sm" style={{ color: 'var(--text-invert)' }}>
                            <p className="mb-2">
                                {c('Warning').t`Found ${orphanedDocCount} documents (${orphanedChunkCount} chunks) referencing ${orphanedSpaceIds.length} missing space(s).`}
                            </p>
                            <p className="mb-2">
                                {c('Info').t`This may indicate that projects were deleted but their indexed files weren't cleaned up, or that spaces failed to load from IndexedDB.`}
                            </p>
                            <details className="mb-3">
                                <summary className="cursor-pointer">{c('Action').t`Show orphaned space IDs`}</summary>
                                <ul className="mt-2 ml-4 text-xs" style={{ wordBreak: 'break-all' }}>
                                    {orphanedSpaceIds.map((id) => (
                                        <li key={id}>{id}</li>
                                    ))}
                                </ul>
                            </details>
                            <Button
                                onClick={handleCleanupOrphaned}
                                loading={isCleaningUp}
                                color="danger"
                                shape="solid"
                                size="small"
                            >
                                <Icon name="trash" size={3.5} className="mr-1" />
                                {c('Action').t`Clean up orphaned documents`}
                            </Button>
                        </div>
                    </div>
                )}

                <Button onClick={handleInspect} shape="outline" className="self-start">
                    <Icon name="eye" size={4} className="mr-2" />
                    {c('Action').t`Inspect indexed documents`}
                </Button>
            </div>
        );
    };

    return (
        <ModalTwo open={open} onClose={handleClose} size="large">
            <ModalTwoHeader title={c('Title').t`Search Index Debug`} />
            <ModalTwoContent className="p-4">
                {renderContent()}
            </ModalTwoContent>
        </ModalTwo>
    );
};

