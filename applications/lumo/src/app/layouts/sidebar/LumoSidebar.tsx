import { Suspense, lazy, memo, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { AppsDropdown, Icon, useModalStateObject } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { SearchModal } from '../../components/Modals/SearchModal/SearchModal';
import SettingsModal from '../../components/Modals/SettingsModal/SettingsModal';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSearchModal } from '../../providers/SearchModalProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { LumoSidebarUpsell } from '../../upsells';
import LumoLogoHeader from '../header/LumoLogo';
import { FavoritesSidebarSection } from './FavoritesSidebarSection';
import ForBusinessSidebarButton from './ForBusinessSidebarButton';
import { ChatHistorySection } from './components/ChatHistorySection';
import { GallerySidebarButton } from './components/GallerySidebarButton';
import { NewGhostChatButton } from './components/NewChatGhostButton';
import { NewChatSidebarButton } from './components/NewChatSidebarButton';
import { SearchSection } from './components/SearchSection';
import { SidebarBottomUserArea } from './components/SidebarBottomUserArea';
import { SidebarItem } from './components/SidebarItem';
import { useNativeComposerAccountApi } from './hooks/useNativeComposerAccountApi';
import { useSidebarVisibility } from './hooks/useSidebarVisibility';
import { useTextVisibility } from './hooks/useTextVisibility';

import './LumoSidebar.scss';

const ProjectsSidebarSection = lazy(() =>
    import('./ProjectsSidebarSection').then((m) => ({ default: m.ProjectsSidebarSection }))
);

const LumoSidebarContent = () => {
    const { isVisible, isSmallScreen, isCollapsed, toggle, closeOnItemClick } = useSidebar();
    const history = useHistory();
    const { showMobileHeader, showSearch, showGallery } = useSidebarVisibility();
    const showText = useTextVisibility(isCollapsed);
    const settingsModal = useModalStateObject();
    const searchModal = useModalStateObject();
    const { registerOpenFunction } = useSearchModal();
    const [searchValue, setSearchValue] = useState('');

    const { apiKeyManagement } = useLumoFlags();

    useEffect(() => {
        registerOpenFunction(() => searchModal.openModal(true));
    }, [searchModal, registerOpenFunction]);

    useNativeComposerAccountApi();

    if (!isVisible) {
        return null;
    }

    return (
        <>
            <div className="lumo-sidebar">
                {showMobileHeader && (
                    <div className="lumo-sidebar-mobile-header flex flex-row flex-nowrap items-center py-3 px-4 border-bottom border-weak">
                        <img src={lumoCatIcon} alt="Lumo" className="lumo-sidebar-mobile-header-logo shrink-0" />
                        <button
                            className="shrink-0 flex items-center justify-center color-weak interactive-pseudo-inset rounded-sm ml-auto"
                            onClick={toggle}
                            aria-label={c('collider_2025:Button').t`Close sidebar`}
                            style={{ width: '32px', height: '32px' }}
                        >
                            <Icon name="chevron-left" size={4} />
                        </button>
                    </div>
                )}

                <div className="sidebar-section">
                    <NewChatSidebarButton showText={showText} isSmallScreen={isSmallScreen} />
                </div>

                <div className="sidebar-section">
                    <NewGhostChatButton showText={showText} />
                </div>

                {showSearch && (
                    <div className="sidebar-section">
                        <SearchSection
                            showText={showText}
                            value={searchValue}
                            onChange={setSearchValue}
                            onSearchClick={() => searchModal.openModal(true)}
                            isSmallScreen={isSmallScreen}
                        />
                    </div>
                )}

                {showGallery && (
                    <div className="sidebar-section">
                        <GallerySidebarButton showText={showText} onItemClick={closeOnItemClick} />
                    </div>
                )}
                <div className={clsx('sidebar-main-content', isCollapsed && 'flex-shrink')}>
                    <div className="sidebar-section">
                        <Suspense fallback={null}>
                            <ProjectsSidebarSection showText={showText} onItemClick={closeOnItemClick} />
                        </Suspense>
                    </div>

                    <FavoritesSidebarSection showText={showText} onItemClick={closeOnItemClick} />

                    <ChatHistorySection searchValue={searchValue} showText={showText} />
                </div>

                {/* Used to expand the sidebar when the user clicks on the empty space */}
                {isCollapsed && (
                    <>
                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                        <div className="flex-1" onClick={toggle}></div>
                    </>
                )}

                <div className="sidebar-section sidebar-bottom">
                    <LumoSidebarUpsell collapsed={isCollapsed} />

                    <SidebarItem
                        icon="question-circle"
                        label={c('collider_2025:Button').t`Help and support`}
                        onClick={() => window.open(getKnowledgeBaseUrl('/lumo'), '_blank')}
                        showText={showText}
                    />

                    {apiKeyManagement && (
                        <SidebarItem
                            icon="code"
                            label={c('collider_2025:Button').t`API`}
                            onClick={() => {
                                history.push('/docs/api');
                                closeOnItemClick?.();
                            }}
                            showText={showText}
                        />
                    )}

                    <SidebarItem
                        icon="cog-wheel"
                        label={c('collider_2025:Button').t`Settings`}
                        onClick={() => settingsModal.openModal(true)}
                        showText={showText}
                    />

                    <ForBusinessSidebarButton isSmallScreen={isSmallScreen} />

                    <SidebarBottomUserArea showText={showText} />
                </div>
            </div>
            {settingsModal.render && <SettingsModal {...settingsModal.modalProps} />}
            {searchModal.render && <SearchModal {...searchModal.modalProps} />}
        </>
    );
};

const LumoSidebarHeader = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const isGuest = useIsGuest();
    return (
        <div
            className={clsx('flex flex-row flex-nowrap items-center justify-space-between hidden md:flex', {
                'px-5 py-3': !isCollapsed,
                'px-0 pt-2 pb-0': isCollapsed,
            })}
        >
            {!isCollapsed && <LumoLogoHeader />}
            {!isGuest && <AppsDropdown />}
        </div>
    );
};

const LumoSidebar = () => {
    const { isCollapsed, isOverlay, toggle } = useSidebar();

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            {isOverlay && <div className="sidebar-backdrop" onClick={toggle}></div>}
            <div
                className={clsx(
                    'sidebar h-full flex flex-nowrap flex-column no-print outline-none border-right border-top border-weak bg-norm',
                    isCollapsed && 'sidebar--collapsed',
                    isOverlay && 'sidebar-expanded'
                )}
            >
                <LumoSidebarHeader isCollapsed={isCollapsed} />
                <LumoSidebarContent />
            </div>
        </>
    );
};

export default memo(LumoSidebar);
