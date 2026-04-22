import type { FC, ReactNode } from 'react';

import { PinUnlock } from 'proton-pass-extension/lib/components/Inline/PinUnlock';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { DesktopUnlock } from '@proton/pass/components/Lock/DesktopUnlock';
import { clientDesktopLocked, clientSessionLocked } from '@proton/pass/lib/client';

export const WithUnlock: FC<{ children: (locked: boolean, input: ReactNode) => ReactNode }> = ({ children }) => {
    const { status } = useAppState();

    if (clientSessionLocked(status)) return children(true, <PinUnlock />);
    if (clientDesktopLocked(status)) return children(true, <DesktopUnlock />);
    return children(false, null);
};
