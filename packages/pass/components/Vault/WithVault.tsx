import { type FC, type ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { isVaultShare } from '../../lib/shares/share.predicates';
import { selectShare } from '../../store/selectors';
import type { MaybeNull, Share, ShareType } from '../../types';

type Props = {
    shareId?: MaybeNull<string>;
    children: (vault: Share<ShareType.Vault>) => ReactNode;
    onFallback?: () => void;
};

export const WithVault: FC<Props> = ({ shareId, children, onFallback }) => {
    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const vaultExists = vault && isVaultShare(vault);

    useEffect(() => {
        if (!vaultExists) onFallback?.();
    }, [vaultExists, onFallback]);

    return vaultExists ? children(vault) : null;
};
