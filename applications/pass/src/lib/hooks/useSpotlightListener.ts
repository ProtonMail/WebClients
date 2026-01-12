import { useEffect } from 'react';

import { spotlight as spotlightService } from 'proton-pass-web/lib/spotlight';

import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { OfflineSetup } from '@proton/pass/components/Onboarding/OfflineSetup';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useSpotlightMessages } from '@proton/pass/hooks/useSpotlightMessages';
import { SpotlightMessage } from '@proton/pass/types';

const WEB_SPOTLIGHTS: SpotlightMessageDefinition[] = [
    {
        type: SpotlightMessage.OFFLINE_SETUP,
        mode: 'custom',
        component: OfflineSetup,
        id: 'offline-setup',
        className: SubTheme.VIOLET,
        weak: true,
    },
];

export const useSpotlightListener = () => {
    const spotlight = useSpotlight();
    const definitions = useSpotlightMessages(WEB_SPOTLIGHTS);

    useEffect(() => {
        const type = spotlightService.getMessage().message;

        switch (type) {
            case null:
                break;
            case SpotlightMessage.PENDING_SHARE_ACCESS:
                spotlight.setPendingShareAccess(true);
                break;
            default:
                const definition = definitions[type];
                if (definition) spotlight.setSpotlight(definition);
                break;
        }
    }, []);
};
