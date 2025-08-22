import {c} from 'ttag';

import {
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemSettingsLink,
    Icon,
} from '@proton/components';
import {LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS} from '@proton/shared/lib/constants';
import lumoPlusLogo from '@proton/styles/assets/img/lumo/lumo-plus-logo.svg';

import {LUMO_PLUS_UPGRADE_PATH, LUMO_UPGRADE_TRIGGER_CLASS} from '../../constants';
import {useLumoPlan} from '../../hooks/useLumoPlan';
import useLumoPlusUpgradeWithTelemetry from '../../hooks/useLumoPlusUpgradeWithTelemetry';
import {useIsGuest} from '../../providers/IsGuestProvider';
import CustomPlusIcon from '../components/CustomPlusIcon';
import LumoPlusUpsellModal from '../upsells/LumoPlusUpsellModal';

import './LumoPlusUpsellSidebarButton.scss';

const getLumoPlusLabel = () => {
    return c('collider_2025:Button').t`Get ${LUMO_SHORT_APP_NAME} Plus`;
};

const LumoPlusSidebarContent = ({collapsed}: { collapsed: boolean }) => {
    if (collapsed) {
        // When collapsed, show the custom plus icon
        return (
            <SidebarListItemContent
                className="color-primary p-3"
                left={
                    <CustomPlusIcon
                        size={16}
                        className="shrink-0 self-center my-auto flex mx-auto"
                    />
                }
                collapsed={collapsed}
            >
                {getLumoPlusLabel()}
            </SidebarListItemContent>
        );
    }

    // When expanded, show "Get" + Lumo+ logo + chevron
    return (
        <SidebarListItemContent
            className="flex items-center w-full"
            collapsed={collapsed}
            right={<Icon name="chevron-right" className="shrink-0"/>}
        >
            <span className="flex items-center gap-2">
                <span className="text-bold" style={{fontFamily: 'Syne, sans-serif'}}>Get</span>
                <img
                    src={lumoPlusLogo}
                    alt="lumo+"
                    style={{height: '12px'}}
                />
            </span>
        </SidebarListItemContent>
    );
};

interface SidebarButtonWrapperProps {
    collapsed: boolean;
    children: React.ReactNode;
}

const SidebarButtonWrapper = ({ collapsed, children }: SidebarButtonWrapperProps) => (
    <div className="mt-6 mx-2">
        <SidebarListItem className={LUMO_UPGRADE_TRIGGER_CLASS}>
            {children}
        </SidebarListItem>
    </div>
);

const getButtonClasses = (collapsed: boolean, includePadding = true) => {
    const padding = includePadding ? 'px-3' : '';
    return `w-full ${padding} ${!collapsed ? 'bg-white rounded-lg p-4 lumo-plus-button-shadow' : ''}`.trim();
};

const LumoPlusSidebarButtonAuthenticated = ({collapsed}: { collapsed: boolean }) => {
    const {upsellRef, openModal, renderModal, modalProps} = useLumoPlusUpgradeWithTelemetry({
        feature: LUMO_UPSELL_PATHS.SIDEBAR_BUTTON,
        buttonType: 'collapsible-sidebar-button',
    });
    const {isOrgOrMultiUser, hasLumoSeat, canShowLumoUpsellB2BOrB2C, isLumoPlanLoading} = useLumoPlan();

    if (isOrgOrMultiUser || hasLumoSeat || isLumoPlanLoading) {
        return null;
    }

    if (canShowLumoUpsellB2BOrB2C) {
        return (
            <SidebarButtonWrapper collapsed={collapsed}>
                <SidebarListItemSettingsLink path={LUMO_PLUS_UPGRADE_PATH} className={getButtonClasses(collapsed, false)}>
                    <LumoPlusSidebarContent collapsed={collapsed}/>
                </SidebarListItemSettingsLink>
            </SidebarButtonWrapper>
        );
    }

    return (
        <>
            <SidebarButtonWrapper collapsed={collapsed}>
                <SidebarListItemButton onClick={openModal} className={getButtonClasses(collapsed)}>
                    <LumoPlusSidebarContent collapsed={collapsed}/>
                </SidebarListItemButton>
            </SidebarButtonWrapper>
            {renderModal && <LumoPlusUpsellModal modalProps={modalProps} upsellRef={upsellRef} specialBackdrop />}
        </>
    );
};

const LumoPlusSidebarButtonGuest = ({collapsed}: { collapsed: boolean }) => (
    <SidebarButtonWrapper collapsed={collapsed}>
        <SidebarListItemSettingsLink path="/signup" className={getButtonClasses(collapsed)}>
            <LumoPlusSidebarContent collapsed={collapsed}/>
        </SidebarListItemSettingsLink>
    </SidebarButtonWrapper>
);

const LumoPlusUpsellSidebarButton = ({collapsed}: { collapsed: boolean }) => {
    const isGuest = useIsGuest();

    if (!isGuest) {
        return <LumoPlusSidebarButtonAuthenticated collapsed={collapsed}/>;
    }
    return <LumoPlusSidebarButtonGuest collapsed={collapsed}/>;
};

export default LumoPlusUpsellSidebarButton;
