import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

import { useOutgoingController } from '../../shared/OutgoingDelegatedAccessProvider';

export const OutgoingEmergencyContactSearchParams = () => {
    const {
        outgoingDelegatedAccess: {
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
                    setTimeout(() => {
                        notify({ type: 'view-access', value: item });
                    });
                    params.delete('id');
                    params.delete('action');
                    return params;
                }
            }
        },
        [items, hasAccess]
    );

    return null;
};
