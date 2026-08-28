import type { FC } from 'react';

import { HOUR } from '@proton/shared/lib/constants';

import { useInAppNotificationVisibility } from '../../hooks/notifications/useInAppNotificationVisibility';
import { useEpoch } from '../../hooks/useEpoch';
import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectActiveNotification } from '../../store/selectors/notification';
import type { MaybeNull } from '../../types';
import { InAppNotificationDisplayType } from '../../types';
import { InAppNotificationBanner } from './InAppNotificationBanner';
import { InAppNotificationModal } from './InAppNotificationModal';
import { OfflineSetupNotification } from './OfflineSetupNotification';
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
    const now = useEpoch(HOUR);
    const notification = useMemoSelector(selectActiveNotification, [now]);
    const visible = useInAppNotificationVisibility(notification);

    /** Client-side notifications only show when the backend has nothing to display
     * in this slot: promo notifications are rooted in the promo menu button. */
    if (notification) {
        const Component = getNotificationComponent(notification.content.displayType);
        if (Component) return visible ? <Component dense={EXTENSION_BUILD} notification={notification} /> : null;
    }

    return <OfflineSetupNotification dense={EXTENSION_BUILD} />;
};
