import { type FC, useMemo } from 'react';

import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import type { InAppNotificationRenderProps } from '@proton/pass/components/Notifications/WithInAppNotification';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationDisplayType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { InAppNotificationBanner } from './InAppNotificationBanner';
import { InAppNotificationModal } from './InAppNotificationModal';

const getNotificationComponent = (displayType: InAppNotificationDisplayType): FC<InAppNotificationRenderProps> => {
    switch (displayType) {
        case InAppNotificationDisplayType.BANNER:
            return InAppNotificationBanner;
        case InAppNotificationDisplayType.MODAL:
            return InAppNotificationModal;
    }
};

export const InAppNotifications: FC = WithFeatureFlag(() => {
    const now = useMemo(() => getEpoch(), []);
    const notification = useMemoSelector(selectNextNotification, [now]);

    if (!notification) return null;

    const Component = getNotificationComponent(notification?.content.displayType);
    return <Component dense={EXTENSION_BUILD} notification={notification} />;
}, PassFeature.PassInAppMessages);
