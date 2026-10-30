import { Suspense, lazy, memo, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import AppsDropdown from '@proton/components/containers/app/AppsDropdown';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { GuestSidebarSignInSection } from '../../components/Guest/ChatHistoryUpsell.tsx/GuestSidebarSignInSection';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { SearchModal } from '../../components/Modals/SearchModal/SearchModal';
import SettingsModal from '../../components/Modals/SettingsModal/SettingsModal';
import { hasVisitedApiDocs } from '../../features/api-docs/apiDocsVisit';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSearchModal } from '../../providers/SearchModalProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { LumoSidebarUpsell } from '../../upsells';
import LumoLogoHeader from '../header/LumoLogo';
import { ScheduledSidebarSection } from './ScheduledSidebarSection';
import { ChatsSidebarSection } from './components/ChatsSidebarSection';
import { CustomizeSidebarButton } from './components/CustomizeSidebarButton';
import { LibrarySidebarButton } from './components/LibrarySidebarButton';
import { NewChatSidebarButton } from './components/NewChatSidebarButton';
import { SearchSection } from './components/SearchSection';
import { SidebarBottomUserArea } from './components/SidebarBottomUserArea';
import { SidebarItem } from './components/SidebarItem';
import { SidebarRouteButton } from './components/SidebarRouteButton';
import { useNativeComposerAccountApi } from './hooks/useNativeComposerAccountApi';
import { useSidebarVisibility } from './hooks/useSidebarVisibility';

import './LumoSidebar.scss';

const ProjectsSidebarSection = lazy(() =>
    import('./ProjectsSidebarSection').then((m) => ({ default: m.ProjectsSidebarSection }))
);

const LumoSidebarContent = () => {
    const { isSmallScreen, toggle, closeOnItemClick } = useSidebar();
    const history = useHistory();
    const { showMobileHeader, showSearch, showGallery, showLibrary, showSchedules, showCustomize } =
        useSidebarVisibility();
    const isGuest = useIsGuest();
    const settingsModal = useModalStateObject();
    const {
        modalProps: searchModalProps,
        openModal: openSearchModal,
        render: searchModalRender,
    } = useModalStateObject();
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
                        {showSchedules && (
                            <SidebarRouteButton
                                icon="Clock"
                                label={c('collider_2025:Button').t`Scheduled`}
                                onItemClick={closeOnItemClick}
                                pathname="/schedules"
                            />
                        )}
                        {showGallery && (
                            <SidebarRouteButton
                                icon="Images"
                                label={c('collider_2025:Button').t`Images`}
                                onItemClick={closeOnItemClick}
                                pathname="/images"
                            />
                        )}
                        {showLibrary && <LibrarySidebarButton onItemClick={closeOnItemClick} />}
                        {showCustomize && <CustomizeSidebarButton onItemClick={closeOnItemClick} />}
                        {apiKeyManagement && (
                            <SidebarItem
                                icon="CodeXml"
                                label={c('collider_2025:Button').t`API`}
                                onClick={() => {
                                    history.push(hasVisitedApiDocs() ? '/docs/api#api-usage' : '/docs/api');
                                    closeOnItemClick?.();
                                }}
                            />
                        )}
                        {!isGuest && (
                            <SidebarRouteButton
                                icon="MessagesSquare"
                                label={c('collider_2025:Button').t`All chats`}
                                onItemClick={closeOnItemClick}
                                pathname="/chats"
                            />
                        )}
                    </div>
                    <Suspense fallback={null}>
                        <ProjectsSidebarSection onItemClick={closeOnItemClick} isSmallScreen={isSmallScreen} />
                    </Suspense>
                    {showSchedules && <ScheduledSidebarSection onItemClick={closeOnItemClick} />}
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
    const { smallScreenMode, largeScreenMode, animateTransitions, closeOverlay } = useSidebar();

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className={clsx(
                    'lumo-sidebar-backdrop',
                    smallScreenMode === 'overlay' && 'lumo-sidebar-backdrop--expanded',
                    animateTransitions && 'lumo-sidebar-backdrop--animate'
                )}
                aria-hidden="true"
                onClick={closeOverlay}
            />
            <div
                className={clsx(
                    'lumo-sidebar-container sidebar rounded-xl bg-norm no-print',
                    largeScreenMode === 'expanded'
                        ? 'sidebar--large-screen-expanded'
                        : 'sidebar--large-screen-collapsed',
                    smallScreenMode === 'overlay'
                        ? 'sidebar--small-screen-expanded'
                        : 'sidebar--small-screen-collapsed',
                    animateTransitions && 'sidebar--animate'
                )}
            >
                <div className="lumo-sidebar-inner flex flex-column flex-nowrap flex-1 min-h-0">
                    <div className="shrink-0">
                        <LumoSidebarHeader />
                    </div>
                    <LumoSidebarContent />
                </div>
            </div>
        </>
    );
};

export default memo(LumoSidebar);
