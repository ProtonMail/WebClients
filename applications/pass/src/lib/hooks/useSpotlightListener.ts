import { useEffect } from 'react';

import { spotlight as spotlightService } from 'proton-pass-web/lib/spotlight';

import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useSpotlightMessages } from '@proton/pass/hooks/useSpotlightMessages';
import { SpotlightMessage } from '@proton/pass/types';

export const useSpotlightListener = () => {
    const spotlight = useSpotlight();
    const definitions = useSpotlightMessages();

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
