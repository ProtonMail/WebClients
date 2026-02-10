import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

import { useOutgoingController } from '../../shared/OutgoingDelegatedAccessProvider';

export const OutgoingRecoveryContactParams = () => {
    const { meta, notify, items } = useOutgoingController();

    const hasAccess = meta.recoveryContacts.hasAccess;

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'recover-info' && hasAccess) {
                const id = params.get('id');
                const item = items.recoveryContacts.find(
                    (item) => item.outgoingDelegatedAccess.DelegatedAccessID === id
                );
                if (item) {
                    // Avoid race conditions with the action affecting the dependencies of this array before the url has updated
                    setTimeout(() => {
                        notify({ type: 'recover-info', value: item });
                    });
                    params.delete('id');
                    params.delete('action');
                    return params;
                }
            }
            if (params.get('action') === 'recover-token' && hasAccess) {
                const id = params.get('id');
                const item = items.recoveryContacts.find(
                    (item) => item.outgoingDelegatedAccess.DelegatedAccessID === id
                );
                if (item) {
                    // Avoid race conditions with the action affecting the dependencies of this array before the url has updated
                    setTimeout(() => {
                        notify({ type: 'recover-token', value: item });
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
