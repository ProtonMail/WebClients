/**
 * Define all re-usable menu items here. If implementation details
 * will change depending on the platform, move handlers to 1PassCoreProvider`
 * FIXME: move URLS to `packages/pass/constants.ts`
 */
import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

export type MenuItem = {
    icon: IconName;
    label: string;
    url?: string;
    onClick?: () => void;
};

export const useFeedbackLinks = (): MenuItem[] => {
    const { openSettings } = usePassCore();

    return [
        {
            icon: 'paper-plane',
            label: c('Action').t`Send us a message`,
            onClick: () => openSettings?.('support'),
        },
        {
            icon: 'brand-twitter',
            label: c('Action').t`Write us on Twitter`,
            url: 'https://twitter.com/Proton_Pass',
        },
        {
            icon: 'brand-reddit',
            label: c('Action').t`Write us on Reddit`,
            url: 'https://www.reddit.com/r/ProtonPass/',
        },
        {
            icon: 'brand-github',
            label: c('Action').t`Help us improve`,
            url: 'https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension',
        },
        {
            icon: 'rocket',
            label: c('Action').t`Request a feature`,
            url: 'https://protonmail.uservoice.com/forums/953584-proton-pass',
        },
    ];
};
