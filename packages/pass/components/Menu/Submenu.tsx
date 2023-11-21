import { type VFC } from 'react';

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

export const Submenu: VFC<{ label: string; icon: IconName; items: MenuItem[] }> = ({ label, icon, items }) => {
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
                <DropdownMenuButtonLabel label={label} icon={icon} />
            </CollapsibleHeader>
            <CollapsibleContent as="ul" className="unstyled mx-2">
                {items.map(({ url, label, icon, onClick }: MenuItem) => (
                    <DropdownMenuButton
                        onClick={url ? () => onLink(url) : onClick}
                        className="pass-vault-submenu-vault-item"
                        parentClassName="w-full"
                        key={label}
                        label={label}
                        icon={icon}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};
