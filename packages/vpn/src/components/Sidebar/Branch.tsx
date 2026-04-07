import { useState } from 'react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    Icon,
    SidebarList,
    SidebarListItemContent,
    SidebarListItemContentIcon,
} from '@proton/components/index';
import type { NavItemResolved } from '@proton/nav/types/nav';

import { Leaf } from './Leaf';
import { OptionalItemLink } from './OptionalItemLink';

export function Branch({ item }: { item: NavItemResolved }) {
    const [isOpen, setIsOpen] = useState(false);
    if (!item.children) {
        return null;
    }

    return (
        <Collapsible
            className="gap-0 interactive rounded"
            expandByDefault={isOpen}
            onToggle={() => {
                setIsOpen(!isOpen);
            }}
            externallyControlled
        >
            <CollapsibleHeader
                className="my-0.5"
                suffix={
                    <div className="icon-size-9 flex justify-center items-center">
                        <Icon size={5} name="chevron-up" className="color-weak" rotate={isOpen ? 0 : 180} />
                    </div>
                }
            >
                <OptionalItemLink to={item.to}>
                    <SidebarListItemContent
                        className="pl-3"
                        left={item.icon ? <SidebarListItemContentIcon name={item.icon} /> : null}
                    >
                        {item.icon ? null : <span className="p-2" />}
                        {item.label}
                    </SidebarListItemContent>
                </OptionalItemLink>
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
