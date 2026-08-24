import { type FC, useMemo } from 'react';

import { useInAppNotificationVisibility } from '../../hooks/notifications/useInAppNotificationVisibility';
import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectActiveNotification } from '../../store/selectors/notification';
import type { MaybeNull } from '../../types';
import { InAppNotificationDisplayType } from '../../types';
import { getEpoch } from '../../utils/time/epoch';
import { InAppNotificationBanner } from './InAppNotificationBanner';
import { InAppNotificationModal } from './InAppNotificationModal';
import type { InAppNotificationRenderProps } from './WithInAppNotification';

const getNotificationComponent = (
    displayType: InAppNotificationDisplayType
): MaybeNull<FC<InAppNotificationRenderProps>> => {
    switch (displayType) {
        case InAppNotificationDisplayType.BANNER:
            return InAppNotificationBanner;
        case InAppNotificationDisplayType.MODAL:
            return InAppNotificationModal;
        /* Promo modal is rooted in the promo menu button to keep state local */
        case InAppNotificationDisplayType.PROMO:
        default:
            return null;
    }
};

export const InAppNotifications: FC = () => {
    const now = useMemo(() => getEpoch(), []);
    const notification = useMemoSelector(selectActiveNotification, [now]);
    const visible = useInAppNotificationVisibility(notification);

    if (!(notification && visible)) return null;

    const Component = getNotificationComponent(notification?.content.displayType);
    return Component && <Component dense={EXTENSION_BUILD} notification={notification} />;
};
