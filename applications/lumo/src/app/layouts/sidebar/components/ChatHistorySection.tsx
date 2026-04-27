import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

import { useSidebar } from '../../../providers/SidebarProvider';
import { ChatHistory } from '../../sidepanel/ChatHistory';
import { CollapsibleSidebarSection } from './CollapsibleSidebarSection';

interface Props {
    searchValue: string;
    showText: boolean;
}

export const ChatHistorySection = ({ searchValue, showText }: Props) => {
    const { closeOnItemClick } = useSidebar();

    return (
        <CollapsibleSidebarSection
            label={c('collider_2025:Title').t`History`}
            icon={<Icon name="clock-rotate-left" size={4} />}
            showText={showText}
            className="chat-history-sidebar-section"
        >
            <div className="chat-history-content">
                <ChatHistory
                    refInputSearch={{ current: null }}
                    onItemClick={closeOnItemClick}
                    searchInput={searchValue}
                />
            </div>
        </CollapsibleSidebarSection>
    );
};
