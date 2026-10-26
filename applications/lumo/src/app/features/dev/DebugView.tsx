import { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversationById } from '../../redux/selectors';
import type { ConversationId, SpaceId } from '../../types';
import { isInternalLumoHost } from '../../util/internalHost';
import { ApiUsageTab } from './ApiUsageTab';
import { NotificationsTab } from './NotificationsTab';
import { PerformanceTab } from './PerformanceTab';
import { RenderingTab } from './RenderingTab';
import { SearchTab } from './SearchTab';
import { StorageTab } from './StorageTab';

import './DebugView.scss';

interface ConversationRouteParams {
    conversationId: ConversationId;
}

interface ProjectRouteParams {
    projectId: SpaceId;
}

type ActiveTab = 'performance' | 'rendering' | 'search' | 'notifications' | 'storage' | 'api-usage';

const DEBUG_FLAG_KEY = 'lumo_debug_perf';

const DebugView = () => {
    const isGuest = useIsGuest();
    const isLoggedIn = !isGuest;
    const conversationMatch = useRouteMatch<ConversationRouteParams>('/c/:conversationId');
    const projectMatch = useRouteMatch<ProjectRouteParams>('/projects/:projectId');
    const currentConversationId = conversationMatch?.params.conversationId;
    const currentConversation = useLumoSelector((state) =>
        currentConversationId ? selectConversationById(currentConversationId)(state) : undefined
    );
    const currentSpaceId = projectMatch?.params.projectId ?? currentConversation?.spaceId;

    const [isVisible, setIsVisible] = useState(false);
    const [activeTabState, setActiveTab] = useState<ActiveTab>('performance');

    useEffect(() => {
        const checkDebug = () => {
            setIsVisible(localStorage.getItem(DEBUG_FLAG_KEY) === 'true');
        };
        checkDebug();
        window.addEventListener('storage', checkDebug);
        return () => window.removeEventListener('storage', checkDebug);
    }, []);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                const newState = !isVisible;
                setIsVisible(newState);
                localStorage.setItem(DEBUG_FLAG_KEY, String(newState));
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isVisible]);

    const isInternalHost = isInternalLumoHost();

    // Derive the active tab so a hidden tab can't be shown even briefly.
    const isTabHidden =
        (!isLoggedIn &&
            (activeTabState === 'search' ||
                activeTabState === 'storage' ||
                activeTabState === 'api-usage')) ||
        (!isInternalHost && (activeTabState === 'rendering' || activeTabState === 'notifications'));
    const activeTab: ActiveTab = isTabHidden ? 'performance' : activeTabState;

    if (!isVisible) return null;

    const tabs: { id: ActiveTab; label: string }[] = [
        { id: 'performance', label: c('lumo: Debug View').t`Performance` },
        ...(isInternalHost ? [{ id: 'rendering' as const, label: c('lumo: Debug View').t`Rendering` }] : []),
        ...(isLoggedIn ? [{ id: 'search' as const, label: c('lumo: Debug View').t`Search` }] : []),
        ...(isInternalHost ? [{ id: 'notifications' as const, label: c('lumo: Debug View').t`Notifications` }] : []),
        ...(isLoggedIn ? [{ id: 'api-usage' as const, label: c('lumo: Debug View').t`API usage` }] : []),
        ...(isLoggedIn ? [{ id: 'storage' as const, label: c('lumo: Debug View').t`Storage` }] : []),
    ];

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'rendering':
                return <RenderingTab />;
            case 'search':
                return <SearchTab enabled={activeTab === 'search'} />;
            case 'notifications':
                return (
                    <NotificationsTab currentConversationId={currentConversationId} currentSpaceId={currentSpaceId} />
                );
            case 'api-usage':
                return <ApiUsageTab />;
            case 'storage':
                return <StorageTab currentConversationId={currentConversationId} showInternalTools={isInternalHost} />;
            case 'performance':
            default:
                return <PerformanceTab isVisible={isVisible} />;
        }
    };

    return (
        <div className="debug-view">
            <div className="debug-view-header">
                <span className="debug-view-header-icon">⚡</span>
                {c('lumo: Debug View').t`Debug View`}
            </div>

            <div className="debug-view-tabs" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`debug-view-tab ${activeTab === tab.id ? 'debug-view-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {renderActiveTab()}

            <div className="debug-view-hint" style={{ marginTop: '12px' }}>
                <strong>Cmd/Ctrl + Shift + P</strong> {c('lumo: Debug View').t`to toggle`}
            </div>
        </div>
    );
};

export default DebugView;
