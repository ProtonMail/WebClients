import type { ReactNode } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import type { ThemeColor } from '@proton/colors';
import type { IconName } from '@proton/icons/types';

import { PromotionButton } from '../button/PromotionButton';
import SidebarListItem from './SidebarListItem';
import SidebarListItemContent from './SidebarListItemContent';
import SidebarListItemContentIcon from './SidebarListItemContentIcon';
import SidebarListItemLink from './SidebarListItemLink';

function OptionalItemLink({ to, children }: { to?: string; children: ReactNode }) {
    if (!to) {
        return children;
    }
    return <SidebarListItemLink to={to}>{children}</SidebarListItemLink>;
}

function getRightComponent(notification: ThemeColor | undefined, upgradeRequired: boolean | undefined) {
    if (upgradeRequired) {
        return (
            <PromotionButton as="span" icon iconName="upgrade" shape="ghost" title={c('Info').t`Upgrade required`}>
                {c('Label').t`Upgrade`}
            </PromotionButton>
        );
    }

    if (notification) {
        return <NotificationDot color={notification} alt={c('Info').t`Attention required`} />;
    }

    return null;
}

interface Props {
    to?: string;
    icon?: IconName;
    notification?: ThemeColor;
    upgradeRequired?: boolean; // if true, will show an upgrade badge
    children: ReactNode;
}

const SettingsListItem = forwardRef<HTMLLIElement, Props>(
    ({ to, icon, children, notification, upgradeRequired }, ref) => {
        return (
            <SidebarListItem ref={ref}>
                <OptionalItemLink to={to}>
                    <SidebarListItemContent
                        left={icon ? <SidebarListItemContentIcon name={icon} /> : null}
                        right={getRightComponent(notification, upgradeRequired)}
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
