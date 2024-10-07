import type { ReactNode } from 'react';

import { useHideAmounts } from '@proton/wallet/store';

export const MaybeHiddenAmount = ({
    children,
    preventHideAmount = false,
}: {
    children: ReactNode;
    preventHideAmount?: boolean;
}) => {
    const hidden = useHideAmounts();

    if (hidden && !preventHideAmount) {
        return '*****';
    }

    return children;
};
