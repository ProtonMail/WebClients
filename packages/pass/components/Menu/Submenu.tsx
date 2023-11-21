import { type FC } from 'react';

import type { IconName } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
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

export const Submenu: FC<Props> = ({ contentClassname, headerClassname, icon, items, label }) => {
    const { onLink } = usePassCore();

    return (
        <Collapsible className="flex-item-noshrink">
            <CollapsibleHeader
                className={clsx(headerClassname, 'flex-item-noshrink pl-4 pr-2')}
                suffix={
                    <CollapsibleHeaderIconButton className="p-0" pill size="small">
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <DropdownMenuButtonLabel label={label} icon={icon} />
            </CollapsibleHeader>
            <CollapsibleContent as="ul" className={clsx(contentClassname, 'unstyled mx-2 my-1')}>
                {items.map(({ url, label, icon, onClick }: MenuItem) => (
                    <DropdownMenuButton
                        onClick={url ? () => onLink(url) : onClick}
                        parentClassName="w-full pass-submenu--item"
                        key={label}
                        label={label}
                        icon={icon}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};
