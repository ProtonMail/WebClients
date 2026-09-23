import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { spotlight as spotlightService } from 'proton-pass-web/lib/spotlight';

import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useSpotlightMessages } from '@proton/pass/hooks/useSpotlightMessages';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { selectPaymentNudgeEligible } from '@proton/pass/store/payment-nudge/selectors';
import { SpotlightMessage } from '@proton/pass/types';

export const useSpotlightListener = () => {
    /** Read through refs rather than the closure: the spotlight context is
     * recreated on every state change, and depending on it would re-resolve
     * the rule list each time a message opens or closes */
    const spotlight = useStatefulRef(useSpotlight());
    const definitions = useStatefulRef(useSpotlightMessages());

    /** Resolved asynchronously after mount, once the payment method lookup
     * lands, so the rule list has to be re-resolved on the flip */
    const paymentNudgeEligible = useSelector(selectPaymentNudgeEligible);

    useEffect(() => {
        const type = spotlightService.getMessage().message;

        switch (type) {
            case null:
                break;
            case SpotlightMessage.PENDING_SHARE_ACCESS:
                spotlight.current.setPendingShareAccess(true);
                break;
            default:
                const definition = definitions.current[type];
                if (!definition) break;

                /** Re-resolving must not steal the slot from a message the
                 * user is already reading */
                const { open, message } = spotlight.current.state;
                if (open && message?.type !== type) break;

                spotlight.current.setSpotlight(definition);
                break;
        }
    }, [paymentNudgeEligible]);
};
