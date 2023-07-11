import { type VFC } from 'react';

import type { IconName } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    DropdownMenuButton,
    Icon,
} from '@proton/components';

export type SubmenuLinkItem = {
    url?: string;
    icon: IconName;
    label: string;
    actionTab?: () => void;
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
                    <CollapsibleHeaderIconButton className="p-0" pill>
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <span className="flex flex-align-items-center">
                    <Icon name={submenuIcon} className="mr-3 color-weak" />
                    {submenuLabel}
                </span>
            </CollapsibleHeader>
            <CollapsibleContent as="ul">
                {linkItems.map((itemLink: SubmenuLinkItem) => (
                    <DropdownMenuButton
                        className="flex flex-align-items-center py-2 px-4"
                        onClick={itemLink.url ? () => window.open(itemLink.url, '_blank') : itemLink.actionTab}
                        key={itemLink.label}
                    >
                        <Icon name={itemLink.icon} className="mr-3 color-weak" />
                        {itemLink.label}
                    </DropdownMenuButton>
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};
