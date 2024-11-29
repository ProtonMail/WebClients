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

// Mapper function to prevent hot-reload pre-initialization errors
const getNotificationComponent = (displayType?: InAppNotificationDisplayType) =>
    ({
        [InAppNotificationDisplayType.BANNER]: InAppNotificationBanner,
        [InAppNotificationDisplayType.MODAL]: InAppNotificationModal,
    })[displayType!] ?? noop;

export const InAppNotifications: FC = withFeatureFlag(() => {
    const notification = useSelector(selectNextNotification(getEpoch()));
    const NotificationComponent = getNotificationComponent(notification?.content.displayType);
    return <NotificationComponent />;
}, PassFeature.PassInAppMessages);
