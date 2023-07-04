import { type VFC } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    DropdownMenuButton,
    Icon,
} from '@proton/components';

import { useOpenSettingsTab } from '../../hooks/useOpenSettingsTab';

type FeedbackLinkItem = {
    url: string;
    icon: IconName;
    label: string;
};

export const FeedbackSubmenu: VFC = () => {
    const openSettings = useOpenSettingsTab();

    const feedbackLinks: FeedbackLinkItem[] = [
        {
            url: 'https://twitter.com/Proton_Pass',
            icon: 'brand-twitter',
            label: c('Action').t`Write us on Twitter`,
        },
        {
            url: 'https://www.reddit.com/r/ProtonPass/',
            icon: 'brand-reddit',
            label: c('Action').t`Write us on Reddit`,
        },
        {
            url: 'https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension',
            icon: 'brand-github',
            label: c('Action').t`Help us improve`,
        },
        {
            url: 'https://protonmail.uservoice.com/forums/953584-proton-pass',
            icon: 'rocket',
            label: c('Action').t`Request a feature`,
        },
    ];

    return (
        <Collapsible>
            <CollapsibleHeader
                className="py-2 pl-4 pr-2"
                suffix={
                    <CollapsibleHeaderIconButton className="p-0" pill>
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <span className="flex flex-align-items-center">
                    <Icon name="bug" className="mr-3 color-weak" />
                    {c('Action').t`Feedback`}
                </span>
            </CollapsibleHeader>
            <CollapsibleContent as="ul">
                <DropdownMenuButton
                    className="flex flex-align-items-center py-2 px-4"
                    onClick={() => openSettings('support')}
                >
                    <Icon name="paper-plane" className="mr-3 color-weak" />
                    {c('Action').t`Send us a message`}
                </DropdownMenuButton>
                {feedbackLinks.map((itemLink: FeedbackLinkItem) => (
                    <DropdownMenuButton
                        className="flex flex-align-items-center py-2 px-4"
                        onClick={() => window.open(itemLink.url, '_blank')}
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
