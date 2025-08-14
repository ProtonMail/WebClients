import clsx from 'clsx';
import { c } from 'ttag';

import {
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
import LumoPlusUpsellModal from '../upsells/LumoPlusUpsellModal';
import LumoSidebarListItemContentIcon from './LumoSidebarListItemContentIcon';

import './LumoPlusUpsellSidebarButton.scss';

const getLumoPlusLabel = () => {
    return c('collider_2025:Button').t`Get ${LUMO_SHORT_APP_NAME} Plus`;
};

const LumoPlusSidebarContent = ({ collapsed }: { collapsed: boolean }) => {
    return (
        <SidebarListItemContent
            className="color-primary"
            left={
                <LumoSidebarListItemContentIcon size={4} className={clsx(collapsed && 'flex mx-auto')} name="upgrade" />
            }
            collapsed={collapsed}
        >
            {getLumoPlusLabel()}
        </SidebarListItemContent>
    );
};

const LumoPlusSidebarButtonAuthenticated = ({ collapsed }: { collapsed: boolean }) => {
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
            <SidebarListItem>
                <SidebarListItemSettingsLink path={LUMO_PLUS_UPGRADE_PATH} className={LUMO_UPGRADE_TRIGGER_CLASS}>
                    <LumoPlusSidebarContent collapsed={collapsed} />
                </SidebarListItemSettingsLink>
            </SidebarListItem>
        );
    }

    return (
        <>
            <SidebarListItem>
                <SidebarListItemButton onClick={openModal} className={LUMO_UPGRADE_TRIGGER_CLASS}>
                    <LumoPlusSidebarContent collapsed={collapsed} />
                </SidebarListItemButton>
            </SidebarListItem>
            {renderModal && <LumoPlusUpsellModal modalProps={modalProps} upsellRef={upsellRef} />}
        </>
    );
};

const LumoPlusSidebarButtonGuest = ({ collapsed }: { collapsed: boolean }) => {
    return (
        <SidebarListItem>
            <SidebarListItemSettingsLink path="/signup" className={LUMO_UPGRADE_TRIGGER_CLASS}>
                <LumoPlusSidebarContent collapsed={collapsed} />
            </SidebarListItemSettingsLink>
        </SidebarListItem>
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
