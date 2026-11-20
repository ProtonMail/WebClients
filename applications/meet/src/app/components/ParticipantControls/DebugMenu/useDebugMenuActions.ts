import { c } from 'ttag';

import { IcBug } from '@proton/icons/icons/IcBug';

import { useDebugOverlayContext } from '../../../contexts/DebugOverlayContext';
import type { MoreMenuAction } from '../MoreMenu/MoreMenuItems';

export const useDebugMenuActions = (onOpenMeetingDebug: () => void): MoreMenuAction[] => {
    const { isEnabled, open: openDebugOverlay } = useDebugOverlayContext();

    if (!isEnabled) {
        return [];
    }

    return [
        {
            id: 'debug-overlay',
            Icon: IcBug,
            label: c('Action').t`Debug overlay`,
            onClick: openDebugOverlay,
        },
        {
            id: 'meeting-debug',
            Icon: IcBug,
            label: c('Action').t`Meeting debug`,
            onClick: onOpenMeetingDebug,
        },
    ];
};
