import { c } from 'ttag';

import { useSidebar } from '../../../providers/SidebarProvider';
import { useLumoSelector } from '../../../redux/hooks';
import { ChatHistory } from '../../sidepanel/ChatHistory';
import { ChatHistoryGroupByMenu } from '../../sidepanel/ChatHistoryGroupByMenu';
import { CollapsibleSidebarSection } from './CollapsibleSidebarSection';

const SKELETON_ROWS = 8;

const ChatHistoryLoadingSkeleton = () => {
    return (
        <div className="flex flex-column gap-1 px-1.5 pt-1">
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <div key={i} className="skeleton rounded-lg" style={{ height: '32px', opacity: 1 - i * 0.08 }} />
            ))}
        </div>
    );
};

export const ChatHistorySection = () => {
    const { closeOnItemClick } = useSidebar();
    const reduxLoadedFromIdb = useLumoSelector((state) => state.initialization.reduxLoadedFromIdb);

    return (
        <CollapsibleSidebarSection
            label={c('collider_2025:Title').t`History`}
            className="chat-history-sidebar-section flex flex-column overflow-hidden flex-1"
            actionButton={<ChatHistoryGroupByMenu />}
        >
            <div className="chat-history-content flex-1">
                {reduxLoadedFromIdb ? <ChatHistory onItemClick={closeOnItemClick} /> : <ChatHistoryLoadingSkeleton />}
            </div>
        </CollapsibleSidebarSection>
    );
};
