import type { ReactNode } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import type { ThemeColor } from '@proton/colors/types';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';

import type { IconComponent } from '../../containers/layout/interface';
import PromotionButton from '../button/PromotionButton/PromotionButton';
import SidebarListItem from './SidebarListItem';
import SidebarListItemContent from './SidebarListItemContent';
import { navigationIconClassName } from './SidebarListItemContentIcon';
import SidebarListItemLink from './SidebarListItemLink';
import { SidebarNotificationIndicator } from './SidebarNotificationIndicator';

function OptionalItemLink({ to, exact, children }: { to?: string; exact?: boolean; children: ReactNode }) {
    if (!to) {
        return children;
    }
    return (
        <SidebarListItemLink to={to} exact={exact}>
            {children}
        </SidebarListItemLink>
    );
}

function getRightComponent(
    notification: ThemeColor | undefined,
    notificationLabel: string | undefined,
    upgradeRequired: boolean | undefined
) {
    if (upgradeRequired) {
        return (
            <PromotionButton
                as="span"
                icon
                iconComponent={IcUpgrade}
                shape="ghost"
                title={c('Info').t`Upgrade required`}
            >
                {c('Label').t`Upgrade`}
            </PromotionButton>
        );
    }

    if (notification) {
        return <SidebarNotificationIndicator color={notification} label={notificationLabel} />;
    }

    return null;
}

interface Props {
    to?: string;
    exact?: boolean; // if true, the item is only active on this exact path, not on its sub-paths
    icon?: IconComponent;
    notification?: ThemeColor;
    notificationLabel?: string;
    upgradeRequired?: boolean; // if true, will show an upgrade badge
    children: ReactNode;
}

const SettingsListItem = forwardRef<HTMLLIElement, Props>(
    ({ to, exact, icon: IconComponent, children, notification, notificationLabel, upgradeRequired }, ref) => {
        return (
            <SidebarListItem ref={ref}>
                <OptionalItemLink to={to} exact={exact}>
                    <SidebarListItemContent
                        left={IconComponent ? <IconComponent className={navigationIconClassName} /> : null}
                        right={getRightComponent(notification, notificationLabel, upgradeRequired)}
                    >
                        {children}
                    </SidebarListItemContent>
                </OptionalItemLink>
            </SidebarListItem>
        );
    }
);

SettingsListItem.displayName = 'SettingsListItem';

export default SettingsListItem;
