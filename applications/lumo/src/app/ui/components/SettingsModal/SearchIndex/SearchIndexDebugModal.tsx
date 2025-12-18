import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

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
    const { lumoUserSettings } = useLumoUserSettings();
    const { indexedFolders: driveIndexedFolders } = useDriveFolderIndexing();
    
    const [foundationStatus, setFoundationStatus] = useState<SearchServiceStatus | undefined>();
    const [viewMode, setViewMode] = useState<'stats' | 'inspectList' | 'inspectDetail'>('stats');
    const [inspectDocs, setInspectDocs] = useState<DriveDocument[]>([]);
    const [selectedGrouped, setSelectedGrouped] = useState<GroupedDocument | null>(null);

    useEffect(() => {
        if (!open || !ENABLE_FOUNDATION_SEARCH || !userId) return;

        const checkStatus = async () => {
            try {
                const service = SearchService.get(userId);
                if (service) {
                    const status = await service.status();
                    setFoundationStatus(status);
                }
            } catch (error) {
                console.error('[SearchDebug] Failed to get status', error);
            }
        };

        void checkStatus();
        const interval = setInterval(checkStatus, 2000);
        return () => clearInterval(interval);
    }, [open, userId]);

    // Get valid space IDs to filter out folders linked to deleted spaces
    const validSpaceIds = new Set<SpaceId>(Object.keys(spaceMap) as SpaceId[]);
    const allIndexedFolders = driveIndexedFolders ?? lumoUserSettings.indexedDriveFolders ?? [];
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
                
                {/* BM25 Stats */}
                {foundationStatus?.bm25Stats && (
                    <div className="p-3 bg-weak rounded">
                        <h4 className="text-sm text-semibold mb-2">{c('Title').t`BM25 Index Statistics`}</h4>
                        <div className="grid gap-2 text-sm" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <span className="color-weak">{c('Label').t`Vocabulary size:`}</span>
                            <span>{(foundationStatus.bm25Stats.vocabularySize ?? 0).toLocaleString()}</span>
                            <span className="color-weak">{c('Label').t`Average doc length:`}</span>
                            <span>{(foundationStatus.bm25Stats.avgDocLength ?? 0).toFixed(1)} {c('Label').t`tokens`}</span>
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

