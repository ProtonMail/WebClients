import type { FC, ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectShare } from '@proton/pass/store/selectors';
import type { MaybeNull, Share, ShareType } from '@proton/pass/types';

type Props = { shareId?: MaybeNull<string>; children: (vault: Share<ShareType.Vault>) => ReactNode };

export const WithVault: FC<Props> = ({ shareId, children }) => {
    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    return vault ? children(vault) : null;
};
