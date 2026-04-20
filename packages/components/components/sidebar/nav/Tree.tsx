import { useState } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import { ThemeColor } from '@proton/colors/types';
import { Sidebar } from '@proton/components/components/sidebar/nav';
import { Icon } from '@proton/components/index';
import type { NavItemResolved, NavResolved } from '@proton/nav/types/nav';

function isThemeColor(value: unknown): value is ThemeColor {
    return Object.values(ThemeColor).includes(value as ThemeColor);
}

function hasNotifications(
    meta: NavItemResolved['meta']
): meta is NavItemResolved['meta'] & { hasNotifications: ThemeColor } {
    return 'hasNotifications' in meta && isThemeColor(meta.hasNotifications);
}

function Leaf({ item }: { item: NavItemResolved }) {
    const notification = hasNotifications(item.meta) ? item.meta.hasNotifications : undefined;
    if (!item.to) {
        return null;
    }

    return (
        <Sidebar.Leaf to={item.to}>
            {item.icon ? <Icon name={item.icon} className="color-weak" /> : <Sidebar.Leaf.IconPlaceholder />}
            <Sidebar.Leaf.Text>{item.label}</Sidebar.Leaf.Text>
            {notification ? <NotificationDot color={notification} alt={c('Info').t`Attention required`} /> : null}
        </Sidebar.Leaf>
    );
}

function Branch({ item }: { item: NavItemResolved }) {
    if (!item.children) {
        return null;
    }

    return (
        <Sidebar.Branch>
            <Sidebar.Branch.Header>
                {item.icon ? <Icon name={item.icon} className="color-weak" /> : <Sidebar.Branch.IconPlaceholder />}
                <Sidebar.Branch.Text>{item.label}</Sidebar.Branch.Text>
                <Sidebar.Branch.Trigger rotation={{ open: 180 }} name="chevron-down" />
            </Sidebar.Branch.Header>
            <Sidebar.Branch.Content>
                {item.children.map((child) => {
                    const Comp = child.children ? Branch : Leaf;
                    return <Comp key={child.id} item={child} />;
                })}
            </Sidebar.Branch.Content>
        </Sidebar.Branch>
    );
}

type Props = {
    routes: NavResolved;
};

export const Tree = ({ routes }: Props) => {
    const firstLevels = routes.items;
    const [openLevel1, setOpenLevel1] = useState<string | undefined>(firstLevels[0].id);
    const toggleLevel1 = (key: typeof openLevel1) => setOpenLevel1((prev) => (prev === key ? undefined : key));

    return (
        <Sidebar.Root>
            {firstLevels.map((item) => (
                <Sidebar.Branch key={item.id} open={openLevel1 === item.id} onOpenChange={() => toggleLevel1(item.id)}>
                    <Sidebar.Branch.Header className="text-lg">
                        <Sidebar.Branch.Trigger rotation={{ closed: 270 }} name="chevron-down-filled" />
                        <Sidebar.Branch.Text>{item.label}</Sidebar.Branch.Text>
                    </Sidebar.Branch.Header>
                    {item.children ? (
                        <Sidebar.Branch.Content>
                            {item.children.map((child) => {
                                const Comp = child.children ? Branch : Leaf;
                                return <Comp key={child.id} item={child} />;
                            })}
                        </Sidebar.Branch.Content>
                    ) : null}
                </Sidebar.Branch>
            ))}
        </Sidebar.Root>
    );
};
