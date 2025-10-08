import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { Status, getStatus, request } from '@proton/shared/lib/helpers/desktopNotification';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import QuickSettingsButton from './QuickSettingsButton';

export const QuickSettingsRequestNotifications = () => {
    const notificationStatus = getStatus();

    if (notificationStatus === Status.GRANTED) {
        return null;
    }

    const requestNotification = async () => {
        await request();
    };

    if (notificationStatus === Status.DENIED) {
        return (
            <div className="text-sm color-weak m-0 text-center">
                <p className="m-0 text-no-decoration inline mr-1">{c('Label')
                    .t`Notifications are disabled, to enable them change the browser settings.`}</p>
                <Href key="learn" href={getKnowledgeBaseUrl('/desktop-notifications')}>{c('Link').t`Learn more`}</Href>
            </div>
        );
    }

    return (
        <QuickSettingsButton onClick={requestNotification}>{c('Label')
            .t`Enable desktop notifications`}</QuickSettingsButton>
    );
};
