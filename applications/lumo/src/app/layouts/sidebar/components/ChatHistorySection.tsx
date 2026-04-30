import { c } from 'ttag';

import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';

import { useSidebar } from '../../../providers/SidebarProvider';
import { ChatHistory } from '../../sidepanel/ChatHistory';
import { CollapsibleSidebarSection } from './CollapsibleSidebarSection';

export const ChatHistorySection = () => {
    const { closeOnItemClick } = useSidebar();

    return (
        <CollapsibleSidebarSection
            label={c('collider_2025:Title').t`History`}
            icon={<IcClockRotateLeft size={4} />}
            showText={showText}
            className="chat-history-sidebar-section flex flex-column overflow-hidden flex-1"
        >
            <div className="chat-history-content flex-1">
                <ChatHistory refInputSearch={{ current: null }} onItemClick={closeOnItemClick} searchInput="" />
            </div>
        </CollapsibleSidebarSection>
    );
};
