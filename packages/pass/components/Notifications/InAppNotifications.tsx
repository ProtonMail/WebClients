import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { withFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationDisplayType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { InAppNotificationBanner } from './InAppNotificationBanner';
import { InAppNotificationModal } from './InAppNotificationModal';

const getNotificationComponent = (displayType?: InAppNotificationDisplayType) => {
    switch (displayType) {
        case InAppNotificationDisplayType.BANNER:
            return InAppNotificationBanner;
        case InAppNotificationDisplayType.MODAL:
            return InAppNotificationModal;
        default:
            return noop;
    }
};

export const InAppNotifications: FC = withFeatureFlag(() => {
    const notification = useSelector(selectNextNotification(getEpoch()));
    const NotificationComponent = getNotificationComponent(notification?.content.displayType);
    return <NotificationComponent />;
}, PassFeature.PassInAppMessages);
