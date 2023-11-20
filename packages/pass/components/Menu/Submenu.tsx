import { type VFC } from 'react';

import type { IconName } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import {
    DropdownMenuButton,
    DropdownMenuButtonLabel,
} from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';

import { usePassCore } from '../Core/PassCoreProvider';
import type { MenuItem } from './hooks';

export const Submenu: VFC<{ submenuLabel: string; submenuIcon: IconName; linkItems: MenuItem[] }> = ({
    submenuIcon,
    submenuLabel,
    linkItems,
}) => {
    const { onLink } = usePassCore();

    return (
        <Collapsible>
            <CollapsibleHeader
                className="pl-4 pr-2"
                suffix={
                    <CollapsibleHeaderIconButton className="p-0" pill size="small">
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <DropdownMenuButtonLabel label={submenuLabel} icon={submenuIcon} />
            </CollapsibleHeader>
            <CollapsibleContent as="ul">
                {linkItems.map(({ url, label, icon, onClick }: MenuItem) => (
                    <DropdownMenuButton
                        onClick={url ? () => onLink(url) : onClick}
                        key={label}
                        label={label}
                        icon={icon}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};
