import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms';
import {
    Icon,
    Sidebar,
    SidebarDrawerItems,
    SidebarLogo,
    SidebarNav,
    useActiveBreakpoint,
    useApi,
    useLocalState,
} from '@proton/components';
import AppsDropdown from '@proton/components/containers/app/AppsDropdown';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { APPS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import {
    COLLAPSE_EVENTS,
    SOURCE_EVENT,
    sendRequestCollapsibleSidebarReport,
    useLeftSidebarButton,
} from '@proton/shared/lib/helpers/collapsibleSidebar';
import isEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getCanAddStorage } from '@proton/shared/lib/user/storage';
import clsx from '@proton/utils/clsx';

import { FreeUploadCounter } from '../../components/layout/sidebar/DriveSidebar/FreeUploadCounter';
import SidebarStorageUpsell from '../../components/layout/sidebar/SidebarStorageUpsell';
import { useIsFreeUploadInProgress } from '../../hooks/drive/freeUpload/useIsFreeUploadInProgress';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { useDebug } from '../../hooks/drive/useDebug';
import type { ShareWithKey } from '../../store';
import { useCreateDevice } from '../../store/_shares/useCreateDevice';
import { useCreatePhotos } from '../../store/_shares/useCreatePhotos';
import { useDefaultShare } from '../../store/_shares/useDefaultShare';
import { logPerformanceMarker } from '../../utils/performance';
import { ActionMenuButton } from './ActionMenu/ActionMenuButton';
import { DriveSidebarFooter } from './DriveSidebarFooter';
import { DriveSidebarList } from './DriveSidebarList';
import { subscribeToSidebarEvents } from './hooks/subscribeToSidebarEvents';
import { useSidebarStore } from './hooks/useSidebar.store';
import { useSidebarFolders } from './hooks/useSidebarFolders';

interface DriveSidebarProps {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    isNewUploadDisabled: boolean;
}

export const DriveSidebar = ({ isNewUploadDisabled, isHeaderExpanded, toggleHeaderExpanded }: DriveSidebarProps) => {
    const { activeShareId } = useActiveShare();
    const { getDefaultShare } = useDefaultShare();
    const debug = useDebug();
    const [defaultShare, setDefaultShare] = useState<ShareWithKey>();
    const { createDevice } = useCreateDevice();
    const { createPhotosShare } = useCreatePhotos();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [showSideBar, setShowSideBar] = useLocalState(true, `${user.ID}-${APPS.PROTONDRIVE}-left-nav-opened`);
    const { viewportWidth } = useActiveBreakpoint();
    const api = useApi();
    const [storageHeight, setStorageHeight] = useState<number>(0);
    const navigationRef = useRef<HTMLDivElement>(null);
    const storageRef = useRef<HTMLDivElement>(null);

    // This is same logic is in SidebarStorageUpsell to determine if we show the storage button
    const showStorage =
        getCanAddStorage({ user, subscription }) && (user.Subscribed === PRODUCT_BIT.DRIVE || user.Subscribed === 0);

    const collapsed = !showSideBar && !viewportWidth['<=small'];
    const currentStorage = storageRef.current;

    const { loadFoldersRoot } = useSidebarFolders();
    const { isScrollPresent } = useLeftSidebarButton({
        navigationRef,
    });

    const { setCollapsed } = useSidebarStore(
        useShallow((state) => ({
            setCollapsed: state.setCollapsed,
        }))
    );

    const logo = <SidebarLogo collapsed={collapsed} to="/drive" app={APPS.PROTONDRIVE} />;

    useEffect(() => {
        void loadFoldersRoot();
        const unsubscribe = subscribeToSidebarEvents();
        return () => {
            unsubscribe();
        };
    }, [loadFoldersRoot]);

    useEffectOnce(() => {
        logPerformanceMarker('drive_performance_clicktonavrendered_histogram');
    });

    useEffect(() => {
        void getDefaultShare().then((share) => {
            // This prevents some re-rendering
            // There is no point re-setting the default share if it has not changed
            if (!isEqual(defaultShare, share)) {
                setDefaultShare(share);
            }
        });
    }, [getDefaultShare]);

    useEffect(() => {
        if (currentStorage && currentStorage.clientHeight) {
            setStorageHeight(currentStorage.clientHeight);
        }
        setCollapsed(collapsed);
    }, [currentStorage, collapsed, setCollapsed, setStorageHeight]);

    const displayContactsInHeader = useDisplayContactsWidget();

    const onClickExpandNav = (sourceEvent = SOURCE_EVENT.BUTTON_SIDEBAR) => {
        sendRequestCollapsibleSidebarReport({
            api,
            action: showSideBar ? COLLAPSE_EVENTS.COLLAPSE : COLLAPSE_EVENTS.EXPAND,
            application: APPS.PROTONMAIL,
            sourceEvent,
        });
        setShowSideBar(!showSideBar);
    };

    /*
     * The sidebar supports multiple shares, but as we currently have
     * only one main share in use, we gonna use the default share only,
     * unless the opposite is decided.
     */
    const shares = defaultShare ? [defaultShare] : [];

    const isFreeUploadInProgress = useIsFreeUploadInProgress();

    return (
        <Sidebar
            app={APPS.PROTONDRIVE}
            appsDropdown={<AppsDropdown app={APPS.PROTONDRIVE} />}
            logo={logo}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            primary={
                <ActionMenuButton className="hidden md:flex" collapsed={collapsed} disabled={isNewUploadDisabled} />
            }
            version={<DriveSidebarFooter />}
            preFooter={isFreeUploadInProgress ? <FreeUploadCounter /> : null}
            postFooter={showStorage ? <SidebarStorageUpsell storageRef={storageRef} app={APPS.PROTONDRIVE} /> : null}
            navigationRef={navigationRef}
            collapsed={collapsed}
            showStorage={showSideBar}
            wavyMeter={isFreeUploadInProgress}
        >
            <SidebarNav className="flex *:min-size-auto">
                <div>
                    <DriveSidebarList shareId={activeShareId} userShares={shares} />
                    {displayContactsInHeader && <SidebarDrawerItems toggleHeaderDropdown={toggleHeaderExpanded} />}
                </div>

                <span
                    className={clsx(
                        'mt-auto',
                        !collapsed && 'absolute bottom-0 right-0',
                        !collapsed && !showStorage && 'sidebar-collapse-button-container--not-collapsed-no-storage',
                        isScrollPresent && 'sidebar-collapse-button-container--above-scroll'
                    )}
                    style={{
                        ...(!collapsed && showStorage
                            ? { marginBlockEnd: `calc(var(--space-16) + ${storageHeight}px)` }
                            : {}),
                    }}
                >
                    {collapsed && <div aria-hidden="true" className="border-top my-1 mx-3"></div>}
                    {(!showStorage || (showStorage && storageHeight > 0) || collapsed) && (
                        <Tooltip
                            title={
                                showSideBar
                                    ? c('Action').t`Collapse navigation bar`
                                    : c('Action').t`Display navigation bar`
                            }
                            originalPlacement="right"
                        >
                            <button
                                className={clsx(
                                    'hidden md:flex sidebar-collapse-button navigation-link-header-group-control color-weak shrink-0',
                                    !showSideBar && 'sidebar-collapse-button--collapsed',
                                    collapsed ? 'mx-auto' : 'mr-2 ml-auto',
                                    isScrollPresent && 'sidebar-collapse-button--above-scroll'
                                )}
                                onClick={() => onClickExpandNav()}
                                aria-pressed={showSideBar}
                            >
                                <Icon
                                    name={showSideBar ? 'chevrons-left' : 'chevrons-right'}
                                    alt={c('Action').t`Show navigation bar`}
                                />
                            </button>
                        </Tooltip>
                    )}
                </span>
            </SidebarNav>
            {debug ? <button onClick={createDevice}>Create device</button> : null}
            {debug ? <button onClick={createPhotosShare}>Create photos</button> : null}
        </Sidebar>
    );
};
