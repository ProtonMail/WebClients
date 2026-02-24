import React, {Suspense, lazy, memo, useCallback, useEffect, useState} from 'react';
import {useHistory} from 'react-router-dom';

import {clsx} from 'clsx';
import {c} from 'ttag';

import {Kbd} from '@proton/atoms/Kbd/Kbd';
import {Tooltip} from '@proton/atoms/Tooltip/Tooltip';
import {Icon, UserDropdown, useConfig, useModalStateObject} from '@proton/components';
import {metaKey} from '@proton/shared/lib/helpers/browser';
import {getKnowledgeBaseUrl} from '@proton/shared/lib/helpers/url';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import {useGuestChatHandler} from '../../hooks/useGuestChatHandler';
import {useGhostChat} from '../../providers/GhostChatProvider';
import {useIsGuest} from '../../providers/IsGuestProvider';
import {useSearchModal} from '../../providers/SearchModalProvider';
import {useSidebar} from '../../providers/SidebarProvider';
import {GuestChatDisclaimerModal} from '../../components/Modals/GuestChatDisclaimerModal';
import GuestDisclaimer from '../../components/Notifications/GuestDisclaimer';
import {SearchModal} from '../../components/Modals/SearchModal/SearchModal';
import SettingsModal from '../../components/Modals/SettingsModal/SettingsModal';
import {ChatHistory} from '../sidepanel/ChatHistory';
import {LumoSidebarUpsell} from '../../upsells';
import {FavoritesSidebarSection} from './FavoritesSidebarSection';
import ForBusinessSidebarButton from './ForBusinessSidebarButton';

import './LumoSidebar.scss';

const ProjectsSidebarSection = lazy(() =>
    import('./ProjectsSidebarSection').then((m) => ({default: m.ProjectsSidebarSection}))
);

// Hook for text visibility - show immediately as sidebar expands, delay hide during collapse
const useTextVisibility = (isCollapsed: boolean) => {
    const [showText, setShowText] = useState(!isCollapsed);

    useEffect(() => {
        if (isCollapsed) {
            const timer = setTimeout(() => setShowText(false), 200);
            return () => clearTimeout(timer);
        } else {
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
    shortcut?: string;
    showShortcutOnHover?: boolean;
}

const SidebarItem = ({
                         icon,
                         label,
                         onClick,
                         showText,
                         className,
                         shortcut,
                         showShortcutOnHover,
                     }: SidebarItemProps) => (
    <Tooltip title={label} originalPlacement="right">
        <button
            className={clsx('sidebar-item', className, showShortcutOnHover && 'show-shortcut-on-hover')}
            onClick={onClick}
            aria-label={label}
        >
            <div className="sidebar-item-icon">
                <Icon name={icon as any} size={4} className="rtl:mirror"/>
            </div>
            <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                <span className="sidebar-item-label">{label}</span>
                {shortcut && showText && (
                    <span className="sidebar-item-shortcut">
                        <Kbd shortcut={shortcut}/>
                    </span>
                )}
            </span>
        </button>
    </Tooltip>
);

// New Chat Button - same styling as other items
const NewChatButton = ({showText, isSmallScreen}: { showText: boolean; isSmallScreen: boolean }) => {
    const isGuest = useIsGuest();
    const history = useHistory();
    const {setGhostChatMode} = useGhostChat();
    const {handleGuestClick, handleDisclaimerClose, disclaimerModalProps} = useGuestChatHandler();

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
                shortcut={!isSmallScreen ? `${metaKey}+J` : undefined}
                showShortcutOnHover={true}
            />
            {isGuest && disclaimerModalProps.render && (
                <GuestChatDisclaimerModal onClick={handleModalClose} {...disclaimerModalProps.modalProps} />
            )}
        </>
    );
};

// Chat History Section - structured like Projects section for consistency
const ChatHistorySection = ({searchValue, showText}: { searchValue: string; showText: boolean }) => {
    const {shouldShowContent, closeOnItemClick, isCollapsed, toggle} = useSidebar();

    return (
        <div className="chat-history-sidebar-section">
            {/* History header button - same structure as other sidebar items */}
            <Tooltip title={c('collider_2025:Title').t`History`} originalPlacement="right">
                <button
                    className={clsx('sidebar-item', !showText && 'collapsed')}
                    onClick={isCollapsed ? toggle : undefined}
                    aria-label={c('collider_2025:Title').t`History`}
                    style={{cursor: isCollapsed ? 'pointer' : 'default'}}
                >
                    <div className="sidebar-item-icon">
                        <Icon name="clock-rotate-left" size={4}/>
                    </div>
                    <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                        {c('collider_2025:Title').t`History`}
                    </span>
                </button>
            </Tooltip>

            {/* History content - only show when expanded */}
            {!isCollapsed && (
                <div
                    className={clsx('chat-history-content', {
                        'content-visible': shouldShowContent,
                        'text-visible': showText,
                    })}
                >
                    <ChatHistory
                        refInputSearch={{current: null}}
                        onItemClick={closeOnItemClick}
                        searchInput={searchValue}
                    />
                </div>
            )}
        </div>
    );
};

// Search Section with Input Field - keeps icon position stable
const SearchSection = ({
                           showText,
                           onSearchChange,
                           onSearchClick,
                           isSmallScreen,
                       }: {
    showText: boolean;
    onSearchChange: (value: string) => void;
    onSearchClick: () => void;
    isSmallScreen: boolean;
}) => {
    const {isCollapsed, toggle} = useSidebar();
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
        // Open search modal instead of focusing input
        onSearchClick();
    }, [isCollapsed, toggle, onSearchClick]);

    // Always render the same structure to prevent layout shifts
    return (
        <div className="search-section">
            <Tooltip title={isCollapsed ? c('collider_2025:Button').t`Search` : undefined} originalPlacement="right">
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div className={clsx('search-container', isCollapsed && 'collapsed')} onClick={handleSearchClick}>
                    <div className="sidebar-item-icon">
                        <Icon name="magnifier" size={4}/>
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
                        {showText && !isGuest && !isSmallScreen && (
                            <span className="search-shortcut">
                                <Kbd shortcut={`${metaKey}+K`}/>
                            </span>
                        )}
                    </div>
                </div>
            </Tooltip>
        </div>
    );
};

const LumoSidebarContent = () => {
    const {isVisible, isSmallScreen, isCollapsed, toggle, closeOnItemClick} = useSidebar();
    const isGuest = useIsGuest();
    const showText = useTextVisibility(isCollapsed);
    const settingsModal = useModalStateObject();
    const searchModal = useModalStateObject();
    const {registerOpenFunction} = useSearchModal();
    const [searchValue, setSearchValue] = useState('');
    const {APP_NAME} = useConfig();

    // Register search modal open function with context
    React.useEffect(() => {
        registerOpenFunction(() => searchModal.openModal(true));
    }, [searchModal, registerOpenFunction]);

    // Don't render if sidebar is hidden
    if (!isVisible) {
        return null;
    }

    return (
        <>
            <div className="lumo-sidebar">
                {/* Mobile Header: Logo + Close Button */}
                {isSmallScreen && (
                    <div
                        className="flex flex-row flex-nowrap items-center py-3 px-4 border-bottom border-weak"
                        style={{margin: '-16px -16px 0 -16px'}}
                    >
                        <img src={lumoCatIcon} alt="Lumo" className="shrink-0" style={{height: '40px'}}/>
                        <button
                            className="shrink-0 flex items-center justify-center color-weak interactive-pseudo-inset rounded-sm ml-auto"
                            onClick={toggle}
                            aria-label={c('collider_2025:Button').t`Close sidebar`}
                            style={{width: '32px', height: '32px'}}
                        >
                            <Icon name="chevron-left" size={4}/>
                        </button>
                    </div>
                )}

                {/* Search Section - hide on mobile for guests */}
                {!(isSmallScreen && isGuest) && (
                    <div className="sidebar-section">
                        <SearchSection
                            showText={showText}
                            onSearchChange={setSearchValue}
                            onSearchClick={() => searchModal.openModal(true)}
                            isSmallScreen={isSmallScreen}
                        />
                    </div>
                )}

                <div className="sidebar-section">
                    <NewChatButton showText={showText} isSmallScreen={isSmallScreen}/>
                </div>

                <div className="sidebar-section">
                    <Suspense fallback={null}>
                        <ProjectsSidebarSection showText={showText} onItemClick={closeOnItemClick}/>
                    </Suspense>
                </div>

                <FavoritesSidebarSection showText={showText} onItemClick={closeOnItemClick}/>

                <ChatHistorySection searchValue={searchValue} showText={showText}/>

                <div className="sidebar-section sidebar-bottom">
                    <LumoSidebarUpsell collapsed={isCollapsed}/>

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

                    <ForBusinessSidebarButton isSmallScreen={isSmallScreen}/>
                    {/* Desktop-only toggle button */}
                    {!isSmallScreen && (
                        <SidebarItem
                            icon={isCollapsed ? 'chevron-right' : 'chevron-left'}
                            label={
                                isCollapsed
                                    ? c('collider_2025:Button').t`Show sidebar`
                                    : c('collider_2025:Button').t`Hide sidebar`
                            }
                            onClick={toggle}
                            showText={showText}
                        />
                    )}
                    {isSmallScreen && !isGuest && (
                        <div className="sidebar-bottom-user-dropdown mobile-user-dropdown shrink-0 md:hidden">
                            <UserDropdown app={APP_NAME} dropdownIcon={undefined} className="border-none"/>
                        </div>
                    )}
                </div>
            </div>
            {settingsModal.render && <SettingsModal {...settingsModal.modalProps} />}
            {searchModal.render && <SearchModal {...searchModal.modalProps} />}
            {isGuest && isSmallScreen && <GuestDisclaimer/>}
        </>
    );
};

const LumoSidebar = () => {
    const {isCollapsed, isOverlay, toggle} = useSidebar();

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            {isOverlay && <div className="sidebar-backdrop" onClick={toggle}></div>}
            <div
                className={clsx(
                    'sidebar h-full flex flex-nowrap flex-column no-print outline-none border-right border-top border-weak',
                    isCollapsed && 'sidebar--collapsed',
                    isOverlay && 'sidebar-expanded'
                )}
            >
                <LumoSidebarContent/>
            </div>
        </>
    );
};

export default memo(LumoSidebar);
