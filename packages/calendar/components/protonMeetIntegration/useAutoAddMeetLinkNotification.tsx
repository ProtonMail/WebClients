import { useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useApi, useEventManager, useNotifications } from '@proton/components';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { DEFAULT_CALENDAR_USER_SETTINGS } from '@proton/shared/lib/calendar/calendar';
import { AutoAddVideoConferenceLinkProvider } from '@proton/shared/lib/calendar/constants';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { MILLISECONDS_IN_MINUTE } from '@proton/shared/lib/date-fns-utc';

import { useCalendarUserSettings } from '../../calendarUserSettings/hooks';

// Type guard helper to check if auto-add is enabled
const isAutoAddMeetEnabled = (
    setting: typeof DEFAULT_CALENDAR_USER_SETTINGS.AutoAddConferenceLink
): setting is { Provider: AutoAddVideoConferenceLinkProvider; DisplayNotification: number } => {
    return (
        typeof setting === 'object' && setting !== null && setting.Provider === AutoAddVideoConferenceLinkProvider.Meet
    );
};

export const useAutoAddMeetLinkNotification = () => {
    const api = useApi();
    const { call } = useEventManager();
    const notifications = useNotifications();

    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS] = useCalendarUserSettings();
    const autoAddConferenceLink = calendarUserSettings.AutoAddConferenceLink;
    const canAutoAddMeeting = isAutoAddMeetEnabled(autoAddConferenceLink);

    const shouldDisplayNotification =
        isAutoAddMeetEnabled(autoAddConferenceLink) && !!autoAddConferenceLink.DisplayNotification;

    const [isDisabling, setIsDisabling] = useState(false);

    const handleEnableAutoAddMeetLink = async () => {
        await api(updateCalendarUserSettings({ AutoAddConferenceLink: AutoAddVideoConferenceLinkProvider.Meet }));
        await call();
    };

    const handleDisableAutoAddMeetLink = async () => {
        if (isDisabling) {
            return;
        }
        setIsDisabling(true);
        try {
            await api(updateCalendarUserSettings({ AutoAddConferenceLink: AutoAddVideoConferenceLinkProvider.None }));
            await call();
            notifications.createNotification({ text: c('Success').t`Auto-add ${MEET_APP_NAME} links disabled` });
        } catch (error) {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`Failed to update settings`,
            });
        } finally {
            setIsDisabling(false);
        }
    };

    const showAutoAddNotification = () => {
        if (!shouldDisplayNotification) {
            return;
        }

        void handleEnableAutoAddMeetLink();
        const notificationId = notifications.createNotification({
            text: (
                <div>
                    <div>{c('Info').t`We automatically added a ${MEET_APP_NAME} link`}</div>
                    {isDisabling ? (
                        <CircleLoader className="shrink-0" />
                    ) : (
                        <button
                            type="button"
                            className="link align-baseline"
                            aria-label={c('Action').t`Disable auto-add ${MEET_APP_NAME} links feature`}
                            onClick={(e) => {
                                e.stopPropagation();
                                notifications.hideNotification(notificationId);
                                void handleDisableAutoAddMeetLink();
                            }}
                        >
                            {c('Action').t`Turn off auto-add`}
                        </button>
                    )}
                </div>
            ),
            showCloseButton: true,
            expiration: MILLISECONDS_IN_MINUTE,
        });
    };

    return {
        showAutoAddNotification,
        handleDisableAutoAddMeetLink,
        isDisabling,
        canAutoAddMeeting,
    };
};
