import type { ReactNode } from 'react';

import { c } from 'ttag';

import { IDEAL_BRAND_NAME } from '@proton/shared/lib/constants';

export const IdealInfoMessage = (): ReactNode => {
    const idealInfoMessage = c('Info')
        .t`We will redirect you to ${IDEAL_BRAND_NAME} in a new browser tab to complete this transaction. If you use any pop-up blockers, please disable them to continue.`;

    return <div>{idealInfoMessage}</div>;
};
