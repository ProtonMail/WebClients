import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import {
    Icon,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemSettingsLink,
} from '@proton/components';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton';
import type { IconName } from '@proton/icons/types';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import CustomPlusIcon from '../../components/CustomPlusIcon';
import LumoPlusLogoInline from '../../components/Icons/LumoPlusLogoInline';

import './SidebarUpsellButton.scss';

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

interface SidebarButtonWrapperProps {
    collapsed: boolean;
    children: React.ReactNode;
    triggerMobileModal?: boolean;
}

const SidebarButtonWrapper = ({ children, triggerMobileModal = false }: SidebarButtonWrapperProps) => (
    <div className="">
        <SidebarListItem className={clsx(triggerMobileModal && LUMO_UPGRADE_TRIGGER_CLASS)}>{children}</SidebarListItem>
    </div>
);

const getLumoPlusLabel = () => {
    return c('collider_2025:Button').t`Get ${LUMO_SHORT_APP_NAME} Plus`;
};

interface LumoPlusSidebarContentProps {
    collapsed: boolean;
    customText?: string;
    customIcon?: IconName;
}

const LumoPlusSidebarContent = ({ collapsed, customText, customIcon }: LumoPlusSidebarContentProps) => {
    if (collapsed) {
        // When collapsed, show the custom plus icon
        const customLumoPlusIcon = <CustomPlusIcon size={16} className="shrink-0 self-center my-auto flex mx-auto" />;

        return (
            <SidebarListItemContent
                className="color-primary"
                left={
                    customIcon ? (
                        <Icon name={customIcon} size={4} className="shrink-0 self-center my-auto flex mx-auto" />
                    ) : (
                        customLumoPlusIcon
                    )
                }
                collapsed={collapsed}
            >
                {getLumoPlusLabel()}
            </SidebarListItemContent>
        );
    }

    // When expanded, show custom text (or "Get") + Lumo+ logo + chevron
    return (
        <SidebarListItemContent
            className="flex items-center w-full group-hover-opacity-container"
            collapsed={collapsed}
            right={<Icon name="chevron-right" className="shrink-0 group-hover:opacity-100" />}
        >
            <span className="flex items-center gap-2">
                <span className="text-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {customText || c('collider_2025: Upsell Title').t`Get`}
                </span>
                <LumoPlusLogoInline height="12px" />
            </span>
        </SidebarListItemContent>
    );
};

const getButtonClasses = (collapsed: boolean, includePadding = true) => {
    const padding = includePadding ? '' : '';
    return `w-full ${padding} ${!collapsed ? 'lumo-plus-button rounded-lg p-4 lumo-plus-button-shadow' : ''}`.trim();
};

interface SidebarUpsellButtonProps extends PromotionButtonProps<typeof ButtonLike> {
    collapsed: boolean;
    path?: string;
    onClick?: () => void;
    customText?: string;
    customIcon?: IconName;
    className?: string;
}

// TODO: check trigger classes
export const SidebarUpsellButton = ({
    collapsed = false,
    path,
    onClick,
    customText,
    customIcon,
    className,
}: SidebarUpsellButtonProps) => {
    const delayedCollapsed = useDelayedCollapsedState(collapsed);

    const buttonClasses = clsx(getButtonClasses(delayedCollapsed, false), className);
    const buttonClassesWithPadding = clsx(getButtonClasses(delayedCollapsed, true), className);

    return (
        <>
            <SidebarButtonWrapper collapsed={collapsed} triggerMobileModal={true}>
                {path ? (
                    <SidebarListItemSettingsLink path={path || ''} className={buttonClasses}>
                        <LumoPlusSidebarContent
                            collapsed={delayedCollapsed}
                            customText={customText}
                            customIcon={customIcon}
                        />
                    </SidebarListItemSettingsLink>
                ) : (
                    <SidebarListItemButton onClick={onClick} className={buttonClassesWithPadding}>
                        <LumoPlusSidebarContent
                            collapsed={delayedCollapsed}
                            customText={customText}
                            customIcon={customIcon}
                        />
                    </SidebarListItemButton>
                )}
            </SidebarButtonWrapper>
        </>
    );
};

SidebarUpsellButton.displayName = 'SidebarUpsellButton';
