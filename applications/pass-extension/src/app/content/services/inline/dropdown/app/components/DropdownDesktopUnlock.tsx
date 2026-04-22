import type { FC } from 'react';

import { useAutoDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';

export const DropdownDesktopUnlock: FC = () => {
    // There's no ui to display error notification, better not to create them
    useAutoDesktopUnlock({ silentErrors: true });

    // Don't even show a dropdown, rely on the auto unlock trigger
    return null;
};
