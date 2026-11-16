import { useOutgoingController } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { getMetaOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/shared/outgoing/helper';
import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

export const OutgoingEmergencyContactSearchParams = () => {
    const {
        outgoingDelegatedAccess: {
            hasKeysToReactivate,
            emergencyContacts: { hasAccess, items },
        },
        notify,
    } = useOutgoingController();

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'view' && hasAccess) {
                const id = params.get('id');
                const item = items.find((item) => item.outgoingDelegatedAccess.DelegatedAccessID === id);
                if (item) {
                    // Only show the request modal while the request is still pending
                    const { hasRequestedAccess } = getMetaOutgoingDelegatedAccess({
                        now: Date.now(),
                        value: item,
                        hasKeysToReactivate,
                    });
                    if (hasRequestedAccess) {
                        setTimeout(() => {
                            notify({ type: 'view-access', value: item });
                        });
                    }
                    params.delete('id');
                    params.delete('action');
                    return params;
                }
            }
        },
        [items, hasAccess, hasKeysToReactivate]
    );

    return null;
};
