import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import {
    AppsDropdown,
    Icon,
    Sidebar,
    SidebarDrawerItems,
    SidebarNav,
    Tooltip,
    useActiveBreakpoint,
    useApi,
    useLocalState,
} from '@proton/components';
import SidebarStorageUpsell from '@proton/components/containers/payments/subscription/SidebarStorageUpsell';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { APPS } from '@proton/shared/lib/constants';
import {
    COLLAPSE_EVENTS,
    SOURCE_EVENT,
    sendRequestCollapsibleSidebarReport,
    useLeftSidebarButton,
} from '@proton/shared/lib/helpers/collapsibleSidebar';
import isEqual from '@proton/shared/lib/helpers/isDeepEqual';
import clsx from '@proton/utils/clsx';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useDebug } from '../../../../hooks/drive/useDebug';
import type { ShareWithKey } from '../../../../store';
import { useCreateDevice } from '../../../../store/_shares/useCreateDevice';
import { useDefaultShare } from '../../../../store/_shares/useDefaultShare';
import { logPerformanceMarker } from '../../../../utils/performance';
import { ActionMenuButton } from '../ActionMenu/ActionMenuButton';
import DriveSidebarFooter from './DriveSidebarFooter';
import DriveSidebarList from './DriveSidebarList';

interface DriveSidebarProps {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    isNewUploadDisabled: boolean;
    logo: ReactNode;
}

const DriveSidebar = ({ logo, isNewUploadDisabled, isHeaderExpanded, toggleHeaderExpanded }: DriveSidebarProps) => {
    const { activeShareId } = useActiveShare();
    const { getDefaultShare } = useDefaultShare();
    const debug = useDebug();
    const [defaultShare, setDefaultShare] = useState<ShareWithKey>();
    const { createDevice } = useCreateDevice();
    const [user] = useUser();
    const [showSideBar, setShowSideBar] = useLocalState(true, `${user.ID}-${APPS.PROTONDRIVE}-left-nav-opened`);
    const { viewportWidth } = useActiveBreakpoint();
    const api = useApi();
    const navigationRef = useRef<HTMLDivElement>(null);

    const collapsed = !showSideBar && !viewportWidth['<=small'];

    const { isScrollPresent } = useLeftSidebarButton({
        navigationRef,
    });

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
            postFooter={<SidebarStorageUpsell app={APPS.PROTONDRIVE} />}
            navigationRef={navigationRef}
            collapsed={collapsed}
            showStorage={showSideBar}
        >
            <SidebarNav className="flex *:min-size-auto">
                <div>
                    <DriveSidebarList collapsed={collapsed} shareId={activeShareId} userShares={shares} />
                    {displayContactsInHeader && <SidebarDrawerItems toggleHeaderDropdown={toggleHeaderExpanded} />}
                </div>

                <span
                    className={clsx(
                        'mt-auto',
                        !collapsed && 'absolute bottom-0 right-0 sidebar-collapse-button-container--not-collapsed',
                        isScrollPresent && 'sidebar-collapse-button-container--above-scroll'
                    )}
                >
                    {collapsed && <div aria-hidden="true" className="border-top my-1 mx-3"></div>}
                    <Tooltip
                        title={
                            showSideBar ? c('Action').t`Collapse navigation bar` : c('Action').t`Display navigation bar`
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
                </span>
            </SidebarNav>
            {debug ? <button onClick={createDevice}>Create device</button> : null}
        </Sidebar>
    );
};

export default DriveSidebar;
