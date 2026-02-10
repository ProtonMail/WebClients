import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

import { useIncomingController } from '../../shared/IncomingDelegatedAccessProvider';

export const IncomingRecoveryContactParams = () => {
    const { meta, notify, items } = useIncomingController();

    const hasAccess = meta.available;

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'help-recover' && hasAccess) {
                const id = params.get('id');
                const item = items.recoveryContacts.find(
                    (item) => item.incomingDelegatedAccess.DelegatedAccessID === id
                );
                if (item) {
                    // Avoid race conditions with the action affecting the dependencies of this array before the url has updated
                    setTimeout(() => {
                        notify({ type: 'recover', value: item });
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
