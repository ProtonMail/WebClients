import { Suspense, lazy, memo, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { AppsDropdown, useModalStateObject } from '@proton/components';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { GuestSidebarSignInSection } from '../../components/Guest/ChatHistoryUpsell.tsx/GuestSidebarSignInSection';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { SearchModal } from '../../components/Modals/SearchModal/SearchModal';
import SettingsModal from '../../components/Modals/SettingsModal/SettingsModal';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSearchModal } from '../../providers/SearchModalProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { LumoSidebarUpsell } from '../../upsells';
import LumoLogoHeader from '../header/LumoLogo';
import { ChatsSidebarButton } from './components/ChatsSidebarButton';
import { ChatsSidebarSection } from './components/ChatsSidebarSection';
import { GallerySidebarButton } from './components/GallerySidebarButton';
import { NewChatSidebarButton } from './components/NewChatSidebarButton';
import { SearchSection } from './components/SearchSection';
import { SidebarBottomUserArea } from './components/SidebarBottomUserArea';
import { SidebarItem } from './components/SidebarItem';
import { useNativeComposerAccountApi } from './hooks/useNativeComposerAccountApi';
import { useSidebarVisibility } from './hooks/useSidebarVisibility';

import '../sidebar/Sidebar.scss';
import './LumoSidebar.scss';

const ProjectsSidebarSection = lazy(() =>
    import('./ProjectsSidebarSection').then((m) => ({ default: m.ProjectsSidebarSection }))
);

const LumoSidebarContent = () => {
    const { isSmallScreen, toggle, closeOnItemClick } = useSidebar();
    const history = useHistory();
    const { showMobileHeader, showSearch, showGallery } = useSidebarVisibility();
    const isGuest = useIsGuest();
    const settingsModal = useModalStateObject();
    const { modalProps: searchModalProps, openModal: openSearchModal, render: searchModalRender } =
        useModalStateObject();
    const { registerOpenFunction } = useSearchModal();

    const { apiKeyManagement } = useLumoFlags();

    useEffect(() => {
        registerOpenFunction(() => openSearchModal(true));
    }, [openSearchModal, registerOpenFunction]);

    useNativeComposerAccountApi();

    return (
        <>
            <div className="lumo-sidebar flex flex-column flex-1 min-h-0 overflow-hidden">
                {showMobileHeader && (
                    <div className="lumo-sidebar-mobile-header flex flex-row flex-nowrap items-center py-3 px-4 border-bottom border-weak shrink-0">
                        <img src={lumoCatIcon} alt="Lumo" className="lumo-sidebar-mobile-header-logo shrink-0" />
                        <button
                            className="shrink-0 flex items-center justify-center color-weak interactive-pseudo-inset rounded-sm ml-auto"
                            onClick={toggle}
                            aria-label={c('collider_2025:Button').t`Close sidebar`}
                            style={{ width: '32px', height: '32px' }}
                        >
                            <LumoIcon name="ChevronLeft" size={16} />
                        </button>
                    </div>
                )}

                <div className="sidebar-top shrink-0">
                    <NewChatSidebarButton />
                </div>

                <Scroll className="sidebar-main-scroll flex flex-column flex-1 min-h-0" scrollContained>
                    <div className="sidebar-section flex flex-column gap-1">
                        {showSearch && <SearchSection onSearchClick={() => openSearchModal(true)} />}
                        {showGallery && <GallerySidebarButton onItemClick={closeOnItemClick} />}
                        {apiKeyManagement && (
                            <SidebarItem
                                icon="CodeXml"
                                label={c('collider_2025:Button').t`API`}
                                onClick={() => {
                                    history.push('/docs/api');
                                    closeOnItemClick?.();
                                }}
                            />
                        )}
                        {!isGuest && <ChatsSidebarButton onItemClick={closeOnItemClick ?? (() => {})} />}
                    </div>
                    <Suspense fallback={null}>
                        <ProjectsSidebarSection onItemClick={closeOnItemClick} isSmallScreen={isSmallScreen} />
                    </Suspense>
                    <ChatsSidebarSection onItemClick={closeOnItemClick} />
                </Scroll>

                <div className="sidebar-section sidebar-bottom flex flex-column gap-1 shrink-0">
                    <SidebarItem
                        icon="Settings"
                        label={c('collider_2025:Button').t`Settings`}
                        onClick={() => settingsModal.openModal(true)}
                    />
                    {isGuest ? <GuestSidebarSignInSection /> : <LumoSidebarUpsell />}
                    <SidebarBottomUserArea />
                </div>
            </div>
            {settingsModal.render && <SettingsModal {...settingsModal.modalProps} />}
            {searchModalRender && <SearchModal {...searchModalProps} />}
        </>
    );
};

const LumoSidebarHeader = () => {
    const isGuest = useIsGuest();
    return (
        <div className="flex flex-row flex-nowrap items-center justify-space-between hidden md:flex px-5 py-3">
            <LumoLogoHeader />
            {!isGuest && <AppsDropdown />}
        </div>
    );
};

const LumoSidebar = () => {
    const { isVisible, isOverlay, toggle } = useSidebar();

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            {isOverlay && <div className="sidebar-backdrop" onClick={toggle}></div>}
            <div
                className={clsx(
                    'sidebar lumo-sidebar-container h-full min-h-0 flex flex-column overflow-hidden no-print outline-none bg-norm rounded-xl',
                    !isVisible && 'sidebar--hidden',
                    isOverlay && 'sidebar-expanded'
                )}
            >
                <div className="shrink-0">
                    <LumoSidebarHeader />
                </div>
                <LumoSidebarContent />
            </div>
        </>
    );
};

export default memo(LumoSidebar);
