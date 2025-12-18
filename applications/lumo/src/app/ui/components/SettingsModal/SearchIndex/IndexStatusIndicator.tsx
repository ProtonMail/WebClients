import React, { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Icon } from '@proton/components';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { useDriveFolderIndexing } from '../../../../hooks/useDriveFolderIndexing';
import { useLumoSelector } from '../../../../redux/hooks';
import { selectConversations } from '../../../../redux/selectors';
import { SearchService } from '../../../../services/search/searchService';

interface IndexStats {
    conversations: number;
    driveFiles: number;
    driveChunks: number;
    vocabularySize: number;
}

export const IndexStatusIndicator: React.FC = () => {
    const [user] = useUser();
    const userId = user?.ID;
    const conversations = useLumoSelector(selectConversations);
    const { isIndexing } = useDriveFolderIndexing();
    const [stats, setStats] = useState<IndexStats | null>(null);

    useEffect(() => {
        if (!userId) return;

        const loadStats = async () => {
            try {
                const searchService = SearchService.get(userId);
                const status = await searchService.status();

                setStats({
                    conversations: Object.keys(conversations).length,
                    driveFiles: status.driveDocumentsUnique || 0,
                    driveChunks: status.driveChunks || 0,
                    vocabularySize: status.bm25Stats?.vocabularySize || 0,
                });
            } catch (error) {
                console.error('Failed to load index stats:', error);
            }
        };

        void loadStats();
    }, [userId, conversations, isIndexing]);

    if (!stats) {
        return null;
    }

    const hasIndex = stats.conversations > 0 || stats.driveFiles > 0;

    return (
        <div className="flex flex-row items-center gap-3 mt-2">
            <Tooltip title={c('collider_2025: Tooltip').t`Conversations in search index`}>
                <div className="flex items-center gap-1 text-xs color-weak">
                    <Icon name="speech-bubble" size={3.5} className="color-primary" />
                    <span>{stats.conversations}</span>
                </div>
            </Tooltip>

            <Tooltip title={c('collider_2025: Tooltip').t`Drive files indexed`}>
                <div className="flex items-center gap-1 text-xs color-weak">
                    <Icon name="brand-proton-drive" size={3.5} className="color-primary" />
                    <span>{stats.driveFiles}</span>
                </div>
            </Tooltip>

            {hasIndex && stats.vocabularySize > 0 && (
                <Tooltip title={c('collider_2025: Tooltip').t`Unique terms in search vocabulary`}>
                    <div className="flex items-center gap-1 text-xs color-hint">
                        <Icon name="text-quote" className="color-primary" size={3.5} />
                        <span>{stats.vocabularySize.toLocaleString()}</span>
                    </div>
                </Tooltip>
            )}
        </div>
    );
};

