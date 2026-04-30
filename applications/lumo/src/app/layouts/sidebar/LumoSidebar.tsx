import { Suspense, lazy, memo, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { AppsDropdown, useModalStateObject } from '@proton/components';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
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
    const { isVisible, isSmallScreen, toggle, closeOnItemClick } = useSidebar();
    const history = useHistory();
    const { showMobileHeader, showSearch, showGallery } = useSidebarVisibility();
    const settingsModal = useModalStateObject();
    const searchModal = useModalStateObject();
    const { registerOpenFunction } = useSearchModal();

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
            <div className="lumo-sidebar flex flex-column h-full">
                {showMobileHeader && (
                    <div className="lumo-sidebar-mobile-header flex flex-row flex-nowrap items-center py-3 px-4 border-bottom border-weak">
                        <img src={lumoCatIcon} alt="Lumo" className="lumo-sidebar-mobile-header-logo shrink-0" />
                        <button
                            className="shrink-0 flex items-center justify-center color-weak interactive-pseudo-inset rounded-sm ml-auto"
                            onClick={toggle}
                            aria-label={c('collider_2025:Button').t`Close sidebar`}
                            style={{ width: '32px', height: '32px' }}
                        >
                            <IcChevronLeft size={4} />
                        </button>
                    </div>
                )}

                <div className="sidebar-section flex flex-column gap-1">
                    <NewChatSidebarButton />
                    {showSearch && <SearchSection onSearchClick={() => searchModal.openModal(true)} />}
                    {showGallery && <GallerySidebarButton onItemClick={closeOnItemClick} />}
                </div>

                <div className="sidebar-main-content flex flex-column flex-1 gap-2">
                    <Suspense fallback={null}>
                        <ProjectsSidebarSection onItemClick={closeOnItemClick} />
                    </Suspense>
                    <FavoritesSidebarSection onItemClick={closeOnItemClick} />
                    <ChatHistorySection />
                </div>

                <div className="sidebar-section sidebar-bottom flex flex-column gap-1">
                    <LumoSidebarUpsell />

                    {apiKeyManagement && (
                        <SidebarItem
                            icon="code"
                            label={c('collider_2025:Button').t`API`}
                            onClick={() => {
                                history.push('/docs/api');
                                closeOnItemClick?.();
                            }}
                        />
                    )}

                    <SidebarItem
                        icon="cog-wheel"
                        label={c('collider_2025:Button').t`Settings`}
                        onClick={() => settingsModal.openModal(true)}
                    />

                    <ForBusinessSidebarButton isSmallScreen={isSmallScreen} />

                    <SidebarBottomUserArea />
                </div>
            </div>
            {settingsModal.render && <SettingsModal {...settingsModal.modalProps} />}
            {searchModal.render && <SearchModal {...searchModal.modalProps} />}
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
                    'sidebar h-full flex flex-nowrap flex-column no-print outline-none bg-norm rounded-xl',
                    !isVisible && 'sidebar--hidden',
                    isOverlay && 'sidebar-expanded'
                )}
            >
                <LumoSidebarHeader />
                <LumoSidebarContent />
            </div>
        </>
    );
};

export default memo(LumoSidebar);
