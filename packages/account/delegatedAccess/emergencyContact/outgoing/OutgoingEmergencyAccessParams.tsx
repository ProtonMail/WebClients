import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

import { useOutgoingController } from '../../shared/OutgoingDelegatedAccessProvider';

export const OutgoingEmergencyContactSearchParams = () => {
    const { meta, notify, items } = useOutgoingController();

    const hasAccess = meta.emergencyContacts.hasAccess;

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'view' && hasAccess) {
                const id = params.get('id');
                const item = items.emergencyContacts.find(
                    (item) => item.outgoingDelegatedAccess.DelegatedAccessID === id
                );
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
