import { type FC, useContext, useEffect, useRef } from 'react';

import type { IconName } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import CollapsibleContext from '@proton/components/components/collapsible/CollapsibleContext';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import {
    DropdownMenuButton,
    DropdownMenuButtonLabel,
} from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import type { MenuItem } from '@proton/pass/hooks/useMenuItems';
import clsx from '@proton/utils/clsx';

import './Submenu.scss';

type Props = {
    contentClassname?: string;
    headerClassname?: string;
    icon: IconName;
    items: MenuItem[];
    label: string;
};

const SubmenuItems: FC<{ items: MenuItem[] }> = ({ items }) => {
    const { onLink } = usePassCore();
    const last = useRef<HTMLDivElement>(null);
    const { isExpanded } = useContext(CollapsibleContext);

    useEffect(() => {
        if (isExpanded) last.current?.scrollIntoView({ behavior: 'smooth' });
    }, [isExpanded]);

    return items.map(({ url, label, icon, onClick }, idx) => (
        <DropdownMenuButton
            onClick={url ? () => onLink(url) : onClick}
            parentClassName="w-full pass-submenu--item text-lg"
            size="small"
            key={label}
            label={label}
            title={label}
            icon={icon}
            ref={idx === items.length - 1 ? last : undefined}
        />
    ));
};

export const Submenu: FC<Props> = ({ headerClassname, icon, label, contentClassname, items }) => (
    <Collapsible className="shrink-0">
        <CollapsibleHeader
            className={clsx(headerClassname, 'shrink-0 pl-4 pr-2')}
            suffix={
                <CollapsibleHeaderIconButton className="p-0" pill size="small">
                    <Icon name="chevron-down" />
                </CollapsibleHeaderIconButton>
            }
        >
            <DropdownMenuButtonLabel label={label} icon={icon} />
        </CollapsibleHeader>
        <CollapsibleContent as="ul" className={clsx(contentClassname, 'unstyled mx-2 my-1')}>
            <SubmenuItems items={items} />
        </CollapsibleContent>
    </Collapsible>
);
