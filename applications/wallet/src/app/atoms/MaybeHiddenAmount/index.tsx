import type { ReactNode } from 'react';

import { useHideAmounts } from '@proton/wallet/store/hooks/useHideAmounts';

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
