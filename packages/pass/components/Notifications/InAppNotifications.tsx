import { type FC, useEffect, useMemo, useState } from 'react';

import type { InAppNotificationRenderProps } from '@proton/pass/components/Notifications/WithInAppNotification';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectActiveNotification } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { InAppNotificationDisplayType } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { isModalOpen } from '@proton/shared/lib/busy';
import { wait } from '@proton/shared/lib/helpers/promise';

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
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const checkNotificationDisplay = async () => {
            if (notification) {
                // wait in case Pass onboarding modal takes time to open
                await wait(1_500);
                if (notification.content.displayType === InAppNotificationDisplayType.MODAL) {
                    setShowNotification(!isModalOpen());
                } else setShowNotification(true);
            }
        };

        void checkNotificationDisplay();
    }, [notification]);

    if (!notification || !showNotification) return null;

    const Component = getNotificationComponent(notification?.content.displayType);
    if (Component === null) return null;
    return <Component dense={EXTENSION_BUILD} notification={notification} />;
};
