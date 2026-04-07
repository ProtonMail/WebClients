import type { FC } from 'react';

import { useAutoDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';

export const DropdownDesktopUnlock: FC = () => {
    useAutoDesktopUnlock();

    // Don't even show a dropdown, rely on the auto unlock trigger
    return null;
};
