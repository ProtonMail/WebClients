import { type FC, useMemo } from 'react';

import type { InAppNotificationRenderProps } from '@proton/pass/components/Notifications/WithInAppNotification';
import { useInAppNotificationVisibility } from '@proton/pass/hooks/notifications/useInAppNotificationVisibility';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectActiveNotification } from '@proton/pass/store/selectors/notification';
import type { MaybeNull } from '@proton/pass/types';
import { InAppNotificationDisplayType } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { InAppNotificationBanner } from './InAppNotificationBanner';
import { InAppNotificationModal } from './InAppNotificationModal';

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
