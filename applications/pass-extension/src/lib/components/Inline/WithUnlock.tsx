import type { FC, ReactNode } from 'react';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { DesktopUnlock } from '@proton/pass/components/Lock/DesktopUnlock';
import { clientDesktopLocked, clientPasswordLocked, clientSessionLocked } from '@proton/pass/lib/client';

import { PinUnlock } from './PinUnlock';

export const WithUnlock: FC<{ children: (locked: boolean, input: ReactNode) => ReactNode }> = ({ children }) => {
    const { status } = useAppState();

    if (clientSessionLocked(status)) return children(true, <PinUnlock />);
    if (clientDesktopLocked(status)) return children(true, <DesktopUnlock />);
    if (clientPasswordLocked(status)) return children(true, null);

    return children(false, null);
};
