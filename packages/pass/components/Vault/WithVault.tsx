import { type FC, type ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectShare } from '@proton/pass/store/selectors';
import type { MaybeNull, Share, ShareType } from '@proton/pass/types';

type Props = {
    shareId?: MaybeNull<string>;
    children: (vault: Share<ShareType.Vault>) => ReactNode;
    onFallback?: () => void;
};

export const WithVault: FC<Props> = ({ shareId, children, onFallback }) => {
    const vault = useSelector(selectShare<ShareType.Vault>(shareId));

    useEffect(() => {
        if (!vault) onFallback?.();
    }, [vault, onFallback]);

    return vault ? children(vault) : null;
};
