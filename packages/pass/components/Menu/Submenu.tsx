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

export type SubmenuLinkItem = {
    url?: string;
    icon: IconName;
    label: string;
    actionTab?: (...args: any[]) => any;
};

export const Submenu: VFC<{ submenuLabel: string; submenuIcon: IconName; linkItems: SubmenuLinkItem[] }> = ({
    submenuIcon,
    submenuLabel,
    linkItems,
}) => {
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
                {linkItems.map((itemLink: SubmenuLinkItem) => (
                    <DropdownMenuButton
                        onClick={itemLink.url ? () => window.open(itemLink.url, '_blank') : itemLink.actionTab}
                        key={itemLink.label}
                        label={itemLink.label}
                        icon={itemLink.icon}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};
