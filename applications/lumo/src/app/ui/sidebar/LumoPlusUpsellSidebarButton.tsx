import { useEffect, useState } from 'react';

import { c } from 'ttag';

import {
    Icon,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemSettingsLink,
} from '@proton/components';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { LUMO_PLUS_UPGRADE_PATH, LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import useLumoPlusUpgradeWithTelemetry from '../../hooks/useLumoPlusUpgradeWithTelemetry';
import { useIsGuest } from '../../providers/IsGuestProvider';
import CustomPlusIcon from '../components/CustomPlusIcon';
import LumoPlusLogoInline from '../components/LumoPlusLogoInline';
import LumoPlusUpsellModal from '../upsells/LumoPlusUpsellModal';

import './LumoPlusUpsellSidebarButton.scss';

// Hook to manage delayed rendering for smooth animations
const useDelayedCollapsedState = (collapsed: boolean) => {
    const [delayedCollapsed, setDelayedCollapsed] = useState(collapsed);

    useEffect(() => {
        if (collapsed) {
            // Immediately show collapsed state (icon only)
            setDelayedCollapsed(true);
        } else {
            // Delay showing expanded state to allow animation to complete
            const timer = setTimeout(() => {
                setDelayedCollapsed(false);
            }, 320); // Match the sidebar animation timing
            return () => clearTimeout(timer);
        }
    }, [collapsed]);

    return delayedCollapsed;
};

const getLumoPlusLabel = () => {
    return c('collider_2025:Button').t`Get ${LUMO_SHORT_APP_NAME} Plus`;
};

const LumoPlusSidebarContent = ({ collapsed }: { collapsed: boolean }) => {
    if (collapsed) {
        // When collapsed, show the custom plus icon
        return (
            <SidebarListItemContent
                className="color-primary"
                left={<CustomPlusIcon size={16} className="shrink-0 self-center my-auto flex mx-auto" />}
                collapsed={collapsed}
            >
                {getLumoPlusLabel()}
            </SidebarListItemContent>
        );
    }

    // When expanded, show "Get" + Lumo+ logo + chevron
    return (
        <SidebarListItemContent
            className="flex items-center w-full group-hover-opacity-container"
            collapsed={collapsed}
            right={<Icon name="chevron-right" className="shrink-0 group-hover:opacity-100" />}
        >
            <span className="flex items-center gap-2">
                <span className="text-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{c('collider_2025: Upsell Title')
                    .t`Get`}</span>
                <LumoPlusLogoInline height="12px" />
            </span>
        </SidebarListItemContent>
    );
};

interface SidebarButtonWrapperProps {
    collapsed: boolean;
    children: React.ReactNode;
}

const SidebarButtonWrapper = ({ collapsed, children }: SidebarButtonWrapperProps) => (
    <div className="pl-1">
        <SidebarListItem className={LUMO_UPGRADE_TRIGGER_CLASS}>{children}</SidebarListItem>
    </div>
);

const getButtonClasses = (collapsed: boolean, includePadding = true) => {
    const padding = includePadding ? '' : '';
    return `w-full ${padding} ${!collapsed ? 'lumo-plus-button rounded-lg p-4 lumo-plus-button-shadow' : ''}`.trim();
};

const LumoPlusSidebarButtonAuthenticated = ({ collapsed }: { collapsed: boolean }) => {
    const delayedCollapsed = useDelayedCollapsedState(collapsed);
    const { upsellRef, openModal, renderModal, modalProps } = useLumoPlusUpgradeWithTelemetry({
        feature: LUMO_UPSELL_PATHS.SIDEBAR_BUTTON,
        buttonType: 'collapsible-sidebar-button',
    });
    const { isOrgOrMultiUser, hasLumoSeat, canShowLumoUpsellB2BOrB2C, isLumoPlanLoading } = useLumoPlan();

    if (isOrgOrMultiUser || hasLumoSeat || isLumoPlanLoading) {
        return null;
    }

    if (canShowLumoUpsellB2BOrB2C) {
        return (
            <SidebarButtonWrapper collapsed={collapsed}>
                <SidebarListItemSettingsLink
                    path={LUMO_PLUS_UPGRADE_PATH}
                    className={getButtonClasses(delayedCollapsed, false)}
                >
                    <LumoPlusSidebarContent collapsed={delayedCollapsed} />
                </SidebarListItemSettingsLink>
            </SidebarButtonWrapper>
        );
    }

    return (
        <>
            <SidebarButtonWrapper collapsed={collapsed}>
                <SidebarListItemButton onClick={openModal} className={getButtonClasses(delayedCollapsed)}>
                    <LumoPlusSidebarContent collapsed={delayedCollapsed} />
                </SidebarListItemButton>
            </SidebarButtonWrapper>
            {renderModal && <LumoPlusUpsellModal modalProps={modalProps} upsellRef={upsellRef} specialBackdrop />}
        </>
    );
};

const LumoPlusSidebarButtonGuest = ({ collapsed }: { collapsed: boolean }) => {
    const delayedCollapsed = useDelayedCollapsedState(collapsed);
    return (
        <SidebarButtonWrapper collapsed={collapsed}>
            <SidebarListItemSettingsLink path="/signup" className={getButtonClasses(delayedCollapsed)}>
                <LumoPlusSidebarContent collapsed={delayedCollapsed} />
            </SidebarListItemSettingsLink>
        </SidebarButtonWrapper>
    );
};

const LumoPlusUpsellSidebarButton = ({ collapsed }: { collapsed: boolean }) => {
    const isGuest = useIsGuest();

    if (!isGuest) {
        return <LumoPlusSidebarButtonAuthenticated collapsed={collapsed} />;
    }
    return <LumoPlusSidebarButtonGuest collapsed={collapsed} />;
};

export default LumoPlusUpsellSidebarButton;
