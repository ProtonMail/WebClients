import { useContext } from 'react';

import { DesktopAppOptionContext } from '../../contexts/DesktopAppOptionContext';
import type { DesktopAppOption } from '../../utils/desktopAppDetector';

export const useDesktopAppOption = (): DesktopAppOption => {
    const desktopAppOption = useContext(DesktopAppOptionContext);

    if (desktopAppOption === undefined) {
        throw new Error('useDesktopAppOption must be used within a DesktopAppOptionContext provider');
    }

    return desktopAppOption;
};
