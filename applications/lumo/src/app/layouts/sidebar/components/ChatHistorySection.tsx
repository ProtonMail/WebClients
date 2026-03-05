import { clsx } from 'clsx';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';

import { useSidebar } from '../../../providers/SidebarProvider';
import { ChatHistory } from '../../sidepanel/ChatHistory';

interface Props {
    searchValue: string;
    showText: boolean;
}

export const ChatHistorySection = ({ searchValue, showText }: Props) => {
    const { closeOnItemClick, isCollapsed, toggle } = useSidebar();

    return (
        <div className="chat-history-sidebar-section">
            <Tooltip title={c('collider_2025:Title').t`History`} originalPlacement="right">
                <button
                    className={clsx('sidebar-item', !showText && 'collapsed')}
                    onClick={isCollapsed ? toggle : undefined}
                    aria-label={c('collider_2025:Title').t`History`}
                    style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
                >
                    <div className="sidebar-item-icon">
                        <Icon name="clock-rotate-left" size={4} />
                    </div>
                    <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                        {c('collider_2025:Title').t`History`}
                    </span>
                </button>
            </Tooltip>

            {!isCollapsed && (
                <div className="chat-history-content">
                    <ChatHistory
                        refInputSearch={{ current: null }}
                        onItemClick={closeOnItemClick}
                        searchInput={searchValue}
                    />
                </div>
            )}
        </div>
    );
};
