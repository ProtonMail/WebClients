import { Collapsible, CollapsibleContent, CollapsibleHeader, Icon, SidebarList } from '@proton/components/index';
import type { NavItemResolved } from '@proton/nav/types/nav';
import clsx from '@proton/utils/clsx';

import { Branch } from './Branch';
import { useSidebarContext } from './Context';
import { Leaf } from './Leaf';

export function Root({ item }: { item: NavItemResolved }) {
    const { openId, setOpenId } = useSidebarContext();
    const isOpen = openId === item.id;

    if (!item.children) {
        return null;
    }

    return (
        <Collapsible
            expandByDefault={isOpen}
            onToggle={() => {
                setOpenId(isOpen ? null : item.id);
            }}
            externallyControlled
            className="pl-3 pr-2"
        >
            <CollapsibleHeader
                className={clsx([isOpen ? 'text-semibold' : 'color-weak'], 'text-lg navigation-link my-0.5')}
            >
                <div className="flex gap-2 items-center">
                    <Icon name="chevron-right-filled" rotate={isOpen ? 0 : 90} />
                    {item.label}
                </div>
            </CollapsibleHeader>
            <CollapsibleContent>
                <SidebarList>
                    {item.children.map((child) => {
                        const Comp = child.children ? Branch : Leaf;
                        return <Comp key={child.id} item={child} />;
                    })}
                </SidebarList>
            </CollapsibleContent>
        </Collapsible>
    );
}
