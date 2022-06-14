import React, { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, InputFieldTwo, Option, SelectTwo } from '@proton/components/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import {
    FeatureCode,
    SettingsLayoutLeft,
    SettingsSection,
    useCalendarModelEventManager,
} from '@proton/components/containers';
import {
    getCalendarEventSettingsModel,
    getDefaultModel,
} from '@proton/components/containers/calendar/calendarModal/calendarModalState';
import { useApi, useFeature, useLoading, useNotifications } from '@proton/components/hooks';
import { updateCalendarSettings } from '@proton/shared/lib/api/calendars';
import { dedupeNotifications } from '@proton/shared/lib/calendar/alarms';
import { MAX_DEFAULT_NOTIFICATIONS } from '@proton/shared/lib/calendar/constants';
import { modelToNotifications } from '@proton/shared/lib/calendar/modelToNotifications';
import { getIsPersonalCalendar, getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import {
    CalendarBootstrap,
    NotificationModel,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';

import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import Notifications from '../notifications/Notifications';

interface Props {
    calendar: VisualCalendar | SubscribedCalendar;
    bootstrap: CalendarBootstrap;
}

const CalendarEventDefaultsSection = ({ calendar, bootstrap }: Props) => {
    const api = useApi();
    const { call } = useCalendarModelEventManager();
    const { createNotification } = useNotifications();
    const { feature } = useFeature(FeatureCode.SubscribedCalendarReminder);

    const [model, setModel] = useState<ReturnType<typeof getCalendarEventSettingsModel>>(() =>
        getCalendarEventSettingsModel(bootstrap.CalendarSettings)
    );
    const [loadingDuration, withLoadingDuration] = useLoading();
    const [hasTouchedPartDayNotifications, setHasTouchedPartDayNotifications] = useState(false);
    const [hasTouchedFullDayNotifications, setHasTouchedFullDayNotifications] = useState(false);
    const [loadingSavePartDayNotifications, withLoadingSavePartDayNotifications] = useLoading();
    const [loadingSaveFullDayNotifications, withLoadingSaveFullDayNotifications] = useLoading();

    const showDuration = getIsPersonalCalendar(calendar);
    const showNotifications = !getIsSubscribedCalendar(calendar) || !!feature?.Value;

    const displaySuccessNotification = () => {
        createNotification({ type: 'success', text: c('Notification success').t`Event defaults updated` });
    };

    const handleChangeDuration = async ({ value }: SelectChangeEvent<string>) => {
        return withLoadingDuration(
            (async () => {
                setModel((model) => ({
                    ...model,
                    duration: +value,
                }));
                await api(updateCalendarSettings(calendar.ID, { DefaultEventDuration: +value }));
                await call([calendar.ID]);
                displaySuccessNotification();
            })()
        );
    };

    const handleSaveNotifications = (fullDay = false) => {
        const key = fullDay ? 'fullDayNotifications' : 'partDayNotifications';
        const dedupedNotifications = dedupeNotifications(model[key]);
        const withLoading = fullDay ? withLoadingSaveFullDayNotifications : withLoadingSavePartDayNotifications;

        return withLoading(
            (async () => {
                await api(
                    updateCalendarSettings(calendar.ID, {
                        [fullDay ? 'DefaultFullDayNotifications' : 'DefaultPartDayNotifications']:
                            modelToNotifications(dedupedNotifications),
                    })
                );
                await call([calendar.ID]);
                setModel((model) => ({
                    ...model,
                    [key]: dedupedNotifications,
                }));
                const setHasTouchedNotifications = fullDay
                    ? setHasTouchedFullDayNotifications
                    : setHasTouchedPartDayNotifications;
                setHasTouchedNotifications(false);
                displaySuccessNotification();
            })()
        );
    };

    useEffect(() => {
        setModel(getCalendarEventSettingsModel(bootstrap.CalendarSettings));
    }, [bootstrap]);

    if (!showDuration && !showNotifications) {
        return null;
    }

    return (
        <SettingsSection large>
            <div className="h2 mb0-25 text-bold">{c('Default calendar event settings section title')
                .t`Default event settings`}</div>
            {showDuration && (
                <SettingsLayout className="mt2">
                    <SettingsLayoutLeft>
                        <label htmlFor="event-duration" className="text-semibold">
                            {c('Label for default event settings').t`Duration`}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight>
                        <InputFieldTwo
                            disabled={loadingDuration}
                            as={SelectTwo}
                            id="event-duration"
                            data-test-id="create-calendar/event-settings:event-duration"
                            value={model.duration}
                            // @ts-ignore
                            onChange={handleChangeDuration}
                        >
                            {[
                                { text: c('Duration').t`30 minutes`, value: 30 },
                                { text: c('Duration').t`60 minutes`, value: 60 },
                                { text: c('Duration').t`90 minutes`, value: 90 },
                                { text: c('Duration').t`120 minutes`, value: 120 },
                            ].map(({ value, text }) => (
                                <Option key={value} value={value} title={text} />
                            ))}
                        </InputFieldTwo>
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
            {showNotifications && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="event-duration" className="text-semibold">
                            {c('Label for default event notifications').t`Notifications`}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="w100">
                        <Notifications
                            data-test-id="create-calendar/event-settings:default-notification"
                            hasType
                            fullWidth={false}
                            notifications={model.partDayNotifications}
                            canAdd={model.partDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                            disabled={loadingSavePartDayNotifications}
                            addIcon="plus"
                            defaultNotification={getDefaultModel().defaultPartDayNotification}
                            onChange={(notifications: NotificationModel[]) => {
                                setModel({
                                    ...model,
                                    partDayNotifications: notifications,
                                });
                                setHasTouchedPartDayNotifications(true);
                            }}
                        />
                        <div className="mt0-25">
                            <Button
                                onClick={() => handleSaveNotifications(false)}
                                loading={loadingSavePartDayNotifications}
                                disabled={!hasTouchedPartDayNotifications}
                            >
                                {c('Action').t`Save`}
                            </Button>
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
            {showNotifications && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="event-duration" className="text-semibold">
                            {c('Label for default event notifications').t`All-day event notifications`}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="w100">
                        <Notifications
                            data-test-id="create-calendar/event-settings:default-full-day-notification"
                            hasType
                            fullWidth={false}
                            notifications={model.fullDayNotifications}
                            canAdd={model.fullDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                            disabled={loadingSaveFullDayNotifications}
                            addIcon="plus"
                            defaultNotification={getDefaultModel().defaultFullDayNotification}
                            onChange={(notifications: NotificationModel[]) => {
                                setModel({
                                    ...model,
                                    fullDayNotifications: notifications,
                                });
                                setHasTouchedFullDayNotifications(true);
                            }}
                        />
                        <div className="mt0-25">
                            <Button
                                onClick={() => handleSaveNotifications(true)}
                                loading={loadingSaveFullDayNotifications}
                                disabled={!hasTouchedFullDayNotifications}
                            >
                                {c('Action').t`Save`}
                            </Button>
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
            <hr className="mb2 mt2" />
        </SettingsSection>
    );
};

export default CalendarEventDefaultsSection;
