import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';

import IndexedDBUnavailablePage from '../../components/IndexedDBUnavailablePage';
import { DbApi } from '../../indexedDb/db';
import { isIndexedDBAvailable } from '../../indexedDb/util';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversations, selectMessages } from '../../redux/selectors';

interface StorageStats {
    spaces: number;
    conversations: number;
    messages: number;
    dirtyMessages: number;
    dirtyConversations: number;
    dirtySpaces: number;
    dirtyAttachments: number;
}

const downloadJson = (data: unknown, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const ts = () => new Date().toISOString().replace(/[:.]/g, '-');

interface StorageTabProps {
    currentConversationId: string | undefined;
}

export const StorageTab = ({ currentConversationId }: StorageTabProps) => {
    const [user] = useUser();
    const userId = user?.ID;
    const spaces = useLumoSelector((state) => state.spaces || {});
    const conversations = useLumoSelector(selectConversations);
    const messages = useLumoSelector(selectMessages);

    const [stats, setStats] = useState<StorageStats | null>(null);
    const [dirtyMessageIds, setDirtyMessageIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewUnavailable, setPreviewUnavailable] = useState(false);

    const refresh = async () => {
        setError(null);
        setLoading(true);
        try {
            const dbApi = new DbApi(userId);
            await dbApi.initialize();
            const unsynced = await dbApi.findUnsyncedResources();
            const ids = new Set(Object.keys(unsynced.unsyncedMessages));
            setDirtyMessageIds(ids);
            setStats({
                spaces: Object.keys(spaces).length,
                conversations: Object.keys(conversations).length,
                messages: Object.keys(messages).length,
                dirtyMessages: ids.size,
                dirtyConversations: Object.keys(unsynced.unsyncedConversations).length,
                dirtySpaces: Object.keys(unsynced.unsyncedSpaces).length,
                dirtyAttachments: Object.keys(unsynced.unsyncedAttachments).length,
            });
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, [userId]);

    const buildDump = (filterMessage?: (id: string) => boolean) => {
        const filteredMessages = filterMessage
            ? Object.fromEntries(Object.entries(messages).filter(([id]) => filterMessage(id)))
            : messages;
        const conversationIds = new Set(Object.values(filteredMessages).map((m) => m.conversationId));
        const filteredConversations = filterMessage
            ? Object.fromEntries(Object.entries(conversations).filter(([id]) => conversationIds.has(id)))
            : conversations;
        const spaceIds = new Set(Object.values(filteredConversations).map((c) => c.spaceId));
        // strip spaceKey from export for safety
        const sanitizedSpaces = Object.fromEntries(
            Object.entries(spaces).map(([id, space]) => {
                const { spaceKey: _spaceKey, ...rest } = space as any;
                return [id, rest];
            })
        );
        const exportSpaces = filterMessage
            ? Object.fromEntries(Object.entries(sanitizedSpaces).filter(([id]) => spaceIds.has(id)))
            : sanitizedSpaces;
        return {
            exportedAt: new Date().toISOString(),
            userIdHash: userId ? `${userId.slice(0, 6)}…` : null,
            counts: {
                spaces: Object.keys(exportSpaces).length,
                conversations: Object.keys(filteredConversations).length,
                messages: Object.keys(filteredMessages).length,
                dirtyMessages: Object.keys(filteredMessages).filter((id) => dirtyMessageIds.has(id)).length,
            },
            dirtyMessageIds: Array.from(dirtyMessageIds),
            spaces: exportSpaces,
            conversations: filteredConversations,
            messages: Object.fromEntries(
                Object.entries(filteredMessages).map(([id, m]) => [id, { ...m, _dirty: dirtyMessageIds.has(id) }])
            ),
        };
    };

    const handleExportAll = () => {
        downloadJson(buildDump(), `lumo-chats-all-${ts()}.json`);
    };

    const handleExportDirty = () => {
        if (dirtyMessageIds.size === 0) {
            alert('No unsynced messages found.');
            return;
        }
        downloadJson(
            buildDump((id) => dirtyMessageIds.has(id)),
            `lumo-chats-unsynced-${ts()}.json`
        );
    };

    const handleExportCurrent = () => {
        if (!currentConversationId) {
            alert('No conversation is currently open.');
            return;
        }
        downloadJson(
            buildDump((id) => messages[id]?.conversationId === currentConversationId),
            `lumo-chat-${currentConversationId}-${ts()}.json`
        );
    };

    return (
        <div className="debug-view-tab-panel">
            {previewUnavailable && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        background: 'var(--background-norm)',
                        zIndex: 9999,
                    }}
                >
                    <IndexedDBUnavailablePage />
                    <button
                        className="debug-view-btn debug-view-btn--secondary"
                        onClick={() => setPreviewUnavailable(false)}
                        style={{ position: 'fixed', top: '12px', right: '12px', zIndex: 10000 }}
                    >
                        ✕ {c('lumo: Debug View').t`Close preview`}
                    </button>
                </div>
            )}

            <div className="debug-view-header">
                <span className="debug-view-header-icon">💾</span>
                {c('lumo: Debug View').t`Local storage (IndexedDB)`}
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`IndexedDB available`}</span>
                <span className={`debug-view-value ${isIndexedDBAvailable() ? '' : 'debug-view-value--danger'}`}>
                    {isIndexedDBAvailable() ? c('lumo: Debug View').t`Yes` : c('lumo: Debug View').t`No`}
                </span>
            </div>

            {error && (
                <div className="debug-view-row">
                    <span className="debug-view-value debug-view-value--danger">{error}</span>
                </div>
            )}

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Spaces`}</span>
                <span className="debug-view-value">{stats?.spaces ?? '—'}</span>
            </div>
            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Conversations`}</span>
                <span className="debug-view-value">{stats?.conversations ?? '—'}</span>
            </div>
            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Messages`}</span>
                <span className="debug-view-value">{stats?.messages ?? '—'}</span>
            </div>
            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Unsynced messages`}</span>
                <span className={`debug-view-value ${(stats?.dirtyMessages ?? 0) > 0 ? 'debug-view-value--warn' : ''}`}>
                    {stats?.dirtyMessages ?? '—'}
                </span>
            </div>
            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Unsynced conversations`}</span>
                <span className="debug-view-value">{stats?.dirtyConversations ?? '—'}</span>
            </div>
            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Unsynced spaces`}</span>
                <span className="debug-view-value">{stats?.dirtySpaces ?? '—'}</span>
            </div>

            <div className="debug-view-section debug-view-actions">
                <button className="debug-view-btn debug-view-btn--secondary" onClick={refresh} disabled={loading}>
                    🔄 {c('lumo: Debug View').t`Refresh`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={handleExportAll}
                    style={{ background: 'var(--interaction-norm)' }}
                >
                    ⬇️ {c('lumo: Debug View').t`Export all chats (JSON)`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={handleExportDirty}
                    style={{ background: 'var(--signal-warning)' }}
                >
                    ⚠️ {c('lumo: Debug View').t`Export unsynced only (JSON)`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={handleExportCurrent}
                    disabled={!currentConversationId}
                >
                    💬 {c('lumo: Debug View').t`Export current conversation (JSON)`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => setPreviewUnavailable(true)}
                >
                    🚫 {c('lumo: Debug View').t`Preview "IndexedDB unavailable" screen`}
                </button>
                <div className="debug-view-hint">
                    {c('lumo: Debug View')
                        .t`Messages rejected by the backend (e.g. limits) remain locally in IndexedDB with a dirty flag. Exports decrypt content from the in-memory Redux state and tag unsynced messages with _dirty: true. Space encryption keys are stripped.`}
                </div>
            </div>
        </div>
    );
};
