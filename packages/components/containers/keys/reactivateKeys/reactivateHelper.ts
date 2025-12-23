import { c } from 'ttag';

import type { ReactivateKeysResult } from '@proton/shared/lib/keys/reactivation/interface';

export const getKeyReactivationNotification = ({ details }: ReactivateKeysResult) => {
    const { success, failure } = details.reduce(
        (acc, cur) => {
            if (cur.type === 'success') {
                acc.success++;
            } else {
                acc.failure++;
            }
            return acc;
        },
        { success: 0, failure: 0 }
    );

    if (!failure && success) {
        return { type: 'success', text: c('Info').t`All keys successfully reactivated` } as const;
    }

    if (failure && success) {
        return { type: 'success', text: c('Info').t`Some keys successfully reactivated` } as const;
    }

    return { type: 'error', text: c('Error').t`Zero keys reactivated` } as const;
};
