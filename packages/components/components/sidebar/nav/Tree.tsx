import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import { ThemeColor } from '@proton/colors/types';
import type { SidebarNode, SidebarTree } from '@proton/nav/types/sidebar';

import { Badge } from '../../badge/Badge';
import { Sidebar } from './index';
import { getActiveBranches } from './traverse';

function isThemeColor(value: unknown): value is ThemeColor {
    return Object.values(ThemeColor).includes(value as ThemeColor);
}

function hasNotifications(meta: SidebarNode['meta']): meta is SidebarNode['meta'] & { hasNotifications: ThemeColor } {
    return 'hasNotifications' in meta && isThemeColor(meta.hasNotifications);
}

function isBeta(meta: SidebarNode['meta']): boolean {
    return meta.beta === true;
}

function isDefaultOpen(meta: SidebarNode['meta']): boolean {
    return meta.defaultOpen === true;
}

function Leaf({ item }: { item: SidebarNode }) {
    const notification = hasNotifications(item.meta) ? item.meta.hasNotifications : undefined;
    const ItemIcon = item.icon;
    if (!item.to) {
        return null;
    }

    return (
        <Sidebar.Leaf to={item.to}>
            {ItemIcon ? <ItemIcon className="color-weak" /> : <Sidebar.Leaf.IconPlaceholder />}
            <Sidebar.Leaf.Text>{item.label}</Sidebar.Leaf.Text>
            {isBeta(item.meta) ? (
                <Badge className="color-weak text-capitalize" data-testid="beta-badge">{c('Info').t`Beta`}</Badge>
            ) : null}
            {notification ? <NotificationDot color={notification} alt={c('Info').t`Attention required`} /> : null}
        </Sidebar.Leaf>
    );
}

function Branch({ item, activeBranches }: { item: SidebarNode; activeBranches: Set<string> }) {
    const [isOpen, setIsOpen] = useState(activeBranches.has(item.id) || isDefaultOpen(item.meta));
    const ItemIcon = item.icon;

    useEffect(() => {
        if (activeBranches.has(item.id)) {
            setIsOpen(true);
        }
    }, [activeBranches]);

    if (!item.children) {
        return null;
    }

    return (
        <Sidebar.Branch open={isOpen} onOpenChange={setIsOpen}>
            <Sidebar.Branch.Header>
                {ItemIcon ? <ItemIcon className="color-weak" /> : <Sidebar.Branch.IconPlaceholder />}
                <Sidebar.Branch.Text>{item.label}</Sidebar.Branch.Text>
                <Sidebar.Branch.Trigger rotation={{ open: 180 }} name="chevron-down" />
            </Sidebar.Branch.Header>
            <Sidebar.Branch.Content>
                {item.children.map((child) => {
                    const Comp = child.children ? Branch : Leaf;
                    return <Comp key={child.id} item={child} activeBranches={activeBranches} />;
                })}
            </Sidebar.Branch.Content>
        </Sidebar.Branch>
    );
}

type Props = {
    routes: SidebarTree;
    pathname: string;
};

/**
 * Renders a reactive navigation sidebar from a resolved navigation tree.
 *
 * The top-level items are controlled, but they are not an accordion: opening
 * one L1 branch never collapses its siblings. Deeper branches are uncontrolled
 * and manage their own open state, seeded from the active pathname (or a
 * `defaultOpen` meta flag) on mount.
 *
 * The component is always reactive: it automatically opens the branch path
 * that leads to the active leaf based on the current `pathname`, leaving any
 * other open L1 branch untouched.
 *
 * @remarks
 * L2+ branches receive `activeBranches` as a prop and use it to seed their
 * initial open state. They also sync when `activeBranches` changes reference,
 * which happens on every pathname change.
 *
 * @example
 * ```tsx
 * <Tree routes={resolvedRoutes} pathname={location.pathname} />
 * ```
 *
 * @param routes - The resolved navigation tree to render
 * @param pathname - The current URL pathname, used to determine which branches to open
 */
export const Tree = ({ routes, pathname }: Props) => {
    const firstLevels = routes.items;

    const activeBranches = useMemo(() => getActiveBranches(firstLevels, pathname), [firstLevels, pathname]);

    const [openLevel1, setOpenLevel1] = useState<Set<string>>(() => {
        return new Set(firstLevels.filter((item) => activeBranches.has(item.id)).map((item) => item.id));
    });
    const toggleLevel1 = (key: string) =>
        setOpenLevel1((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });

    useEffect(() => {
        const active = firstLevels.find((item) => activeBranches.has(item.id))?.id;
        if (active !== undefined) {
            setOpenLevel1((prev) => (prev.has(active) ? prev : new Set(prev).add(active)));
        }
    }, [pathname]);

    return (
        <Sidebar.Root>
            {firstLevels.map((item) => (
                <Sidebar.Branch key={item.id} open={openLevel1.has(item.id)} onOpenChange={() => toggleLevel1(item.id)}>
                    <Sidebar.Branch.Header className="text-lg">
                        <Sidebar.Branch.Trigger rotation={{ closed: 270 }} name="chevron-down-filled" />
                        <Sidebar.Branch.Text>{item.label}</Sidebar.Branch.Text>
                    </Sidebar.Branch.Header>
                    {item.children ? (
                        <Sidebar.Branch.Content>
                            {item.children.map((child) => {
                                const Comp = child.children ? Branch : Leaf;
                                return <Comp key={child.id} item={child} activeBranches={activeBranches} />;
                            })}
                        </Sidebar.Branch.Content>
                    ) : null}
                </Sidebar.Branch>
            ))}
        </Sidebar.Root>
    );
};
