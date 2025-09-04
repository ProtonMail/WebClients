import { memo, useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import { Icon, UserDropdown, useConfig, useModalStateObject } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import ChatHistorySkeleton from '../components/ChatHistorySkeleton';
import { GuestChatDisclaimerModal } from '../components/GuestChatDisclaimerModal';
import GuestDisclaimer from '../components/GuestDisclaimer';
import SettingsModal from '../components/SettingsModal/SettingsModal';
import { ChatHistory } from '../sidepanel/ChatHistory';
import LumoPlusUpsellSidebarButton from './LumoPlusUpsellSidebarButton';

import './LumoSidebar.scss';

// Hook for text visibility - show immediately as sidebar expands, delay hide during collapse
const useTextVisibility = (isCollapsed: boolean) => {
    const [showText, setShowText] = useState(!isCollapsed);

    useEffect(() => {
        if (isCollapsed) {
            // Delay hiding text to allow sidebar to start collapsing first
            const timer = setTimeout(() => setShowText(false), 200); // 200ms delay for more visible effect
            return () => clearTimeout(timer);
        } else {
            // Show text immediately as sidebar starts expanding
            setShowText(true);
        }
    }, [isCollapsed]);

    return showText;
};

// Simple sidebar item component
interface SidebarItemProps {
    icon: string;
    label: string;
    onClick: () => void;
    showText: boolean;
    className?: string;
}

const SidebarItem = ({ icon, label, onClick, showText, className }: SidebarItemProps) => (
    <Tooltip title={label} originalPlacement="right">
        <button className={clsx('sidebar-item', className)} onClick={onClick} aria-label={label}>
            <div className="sidebar-item-icon">
                <Icon name={icon as any} size={4} />
            </div>
            <span className={clsx('sidebar-item-text', !showText && 'hidden')}>{label}</span>
        </button>
    </Tooltip>
);

// New Chat Button - same styling as other items
const NewChatButton = ({ showText }: { showText: boolean }) => {
    const isGuest = useIsGuest();
    const history = useHistory();
    const { setGhostChatMode } = useGhostChat();
    const { handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();

    const handleNewChat = useCallback(() => {
        setGhostChatMode(false);
        history.push('/');
    }, [setGhostChatMode, history]);

    const handleClick = isGuest ? handleGuestClick : handleNewChat;

    const handleModalClose = useCallback(() => {
        handleDisclaimerClose();
        handleNewChat();
    }, [handleNewChat, handleDisclaimerClose]);

    return (
        <>
            <SidebarItem
                icon="pen-square"
                label={c('collider_2025:Button').t`New chat`}
                onClick={handleClick}
                showText={showText}
            />
            {isGuest && disclaimerModalProps.render && (
                <GuestChatDisclaimerModal onClick={handleModalClose} {...disclaimerModalProps.modalProps} />
            )}
        </>
    );
};

// Chat History Section
const ChatHistorySection = ({ searchValue }: { searchValue: string }) => {
    const { shouldShowContent } = useSidebar();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (shouldShowContent) {
            const timer = setTimeout(() => setShowContent(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
        }
    }, [shouldShowContent]);

    if (!shouldShowContent) return null;

    return (
        <div className="chat-history-section">
            {showContent ? (
                <ChatHistory refInputSearch={{ current: null }} onItemClick={() => {}} searchInput={searchValue} />
            ) : (
                <ChatHistorySkeleton />
            )}
        </div>
    );
};

// Search Section with Input Field - keeps icon position stable
const SearchSection = ({
    showText,
    onSearchChange,
}: {
    showText: boolean;
    onSearchChange: (value: string) => void;
}) => {
    const { isCollapsed, toggle } = useSidebar();
    const isGuest = useIsGuest();
    const [searchValue, setSearchValue] = useState('');
    const placeholder = isGuest
        ? c('collider_2025:Placeholder').t`Sign in required`
        : c('collider_2025:Placeholder').t`Search chats`;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        onSearchChange(value);
    };

    const handleSearchClick = useCallback(() => {
        if (isCollapsed) {
            toggle();
        }
        // Focus search input after sidebar animation completes
        setTimeout(() => {
            const searchInput = document.querySelector('.sidebar-search-input') as HTMLInputElement;
            if (searchInput) searchInput.focus();
        }, 350);
    }, [isCollapsed, toggle]);

    // Always render the same structure to prevent layout shifts
    return (
        <div className="search-section">
            <Tooltip title={isCollapsed ? c('collider_2025:Button').t`Search` : undefined} originalPlacement="right">
                <div className={clsx('search-container', isCollapsed && 'collapsed')} onClick={handleSearchClick}>
                    <div className="sidebar-item-icon">
                        <Icon name="magnifier" size={4} />
                    </div>
                    {/* Always render input - visibility controlled by delayed showText state */}
                    <div className={clsx('search-input-wrapper', !showText && 'hidden')}>
                        <input
                            type="text"
                            className="sidebar-search-input"
                            placeholder={placeholder}
                            value={searchValue}
                            onChange={handleSearchChange}
                            readOnly={isCollapsed || isGuest} // Disable for guests
                            tabIndex={isCollapsed || isGuest ? -1 : 0}
                            disabled={isGuest}
                        />
                    </div>
                    {/* Always render label - visibility controlled by delayed showText state */}
                    <span className={clsx('search-label', showText && 'hidden')}>
                        {c('collider_2025:Button').t`Search`}
                    </span>
                </div>
            </Tooltip>
        </div>
    );
};

const LumoSidebarContent = () => {
    const { isVisible, isSmallScreen, isCollapsed, toggle } = useSidebar();
    const isGuest = useIsGuest();
    const showText = useTextVisibility(isCollapsed);
    const settingsModal = useModalStateObject();
    const [searchValue, setSearchValue] = useState('');
    const { APP_NAME } = useConfig();

    // Don't render if sidebar is hidden
    if (!isVisible) {
        return null;
    }

    return (
        <>
            <div className="lumo-sidebar">
                {/* Mobile Header: Logo + Close Button (ChatGPT style) */}
                {isSmallScreen && (
                    <div className="sidebar-mobile-header">
                        <div className="sidebar-mobile-logo">
                            <img src={lumoCatIcon} alt="Lumo" className="sidebar-logo" />
                        </div>

                        {/* Close button on right */}
                        <button
                            className="sidebar-mobile-close-btn"
                            onClick={toggle}
                            aria-label={c('collider_2025:Button').t`Close sidebar`}
                        >
                            <Icon name="chevron-left" />
                        </button>
                    </div>
                )}

                {/* {isSmallScreen && !isGuest && (
                    <div className="mobile-user-dropdown shrink-0 md:hidden">
                        <UserDropdown app={APP_NAME} />
                    </div>
                )} */}

                {/* Top Section - hide on mobile for guests */}
                {!(isSmallScreen && isGuest) && (
                    <div className="sidebar-section">
                        <NewChatButton showText={showText} />
                    </div>
                )}

                {/* Search Section - hide on mobile for guests */}
                {!(isSmallScreen && isGuest) && (
                    <div className="sidebar-section">
                        <SearchSection showText={showText} onSearchChange={setSearchValue} />
                    </div>
                )}

                {/* Chat History Section */}
                <ChatHistorySection searchValue={searchValue} />

                {/* Bottom Section */}
                <div className="sidebar-section sidebar-bottom">
                    <LumoPlusUpsellSidebarButton collapsed={isCollapsed} />

                    <SidebarItem
                        icon="question-circle"
                        label={c('collider_2025:Button').t`Help and support`}
                        onClick={() => window.open(getKnowledgeBaseUrl('/lumo'), '_blank')}
                        showText={showText}
                    />

                    <SidebarItem
                        icon="cog-wheel"
                        label={c('collider_2025:Button').t`Settings`}
                        onClick={() => settingsModal.openModal(true)}
                        showText={showText}
                    />

                    {/* Desktop-only toggle button */}
                    {!isSmallScreen && (
                        <SidebarItem
                            icon={isCollapsed ? 'chevron-right' : 'chevron-left'}
                            label={c('collider_2025:Button').t`Hide sidebar`}
                            onClick={toggle}
                            showText={showText}
                        />
                    )}
                    {isSmallScreen && !isGuest && (
                        <div className="sidebar-bottom-user-dropdown mobile-user-dropdown shrink-0 md:hidden">
                            <UserDropdown app={APP_NAME} dropdownIcon={undefined} className="border-none" />
                        </div>
                    )}
                </div>
            </div>
            {settingsModal.render && <SettingsModal {...settingsModal.modalProps} />}
            {isGuest && isSmallScreen && <GuestDisclaimer />}
        </>
    );
};

const LumoSidebar = () => {
    const { isCollapsed, isOverlay, toggle } = useSidebar();

    return (
        <>
            {/* Mobile backdrop */}
            {isOverlay && <div className="sidebar-backdrop" onClick={toggle}></div>}

            <div
                className={clsx(
                    'sidebar h-full flex flex-nowrap flex-column no-print outline-none border-right border-top border-weak',
                    isCollapsed && 'sidebar--collapsed',
                    isOverlay && 'sidebar-expanded'
                )}
            >
                <LumoSidebarContent />
            </div>
        </>
    );
};

export default memo(LumoSidebar);
