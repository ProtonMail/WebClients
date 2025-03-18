import type { TypedStartListening } from '@reduxjs/toolkit';

import { organizationThunk, subscriptionThunk, userSettingsThunk, userThunk } from '@proton/account';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { calendarSettingsThunk } from '@proton/calendar/calendarUserSettings';
import { calendarsThunk } from '@proton/calendar/calendars';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { TelemetryHeartbeatEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getVisualCalendars, groupCalendarsByTaxonomy } from '@proton/shared/lib/calendar/calendar';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import { PROTON_DEFAULT_THEME_SETTINGS, PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';

import { getCalendarArrayLength, getCalendarViewPreference, getWeekStart } from './calendarHeartbeatHelper';
import {
    formatBooleanForHeartbeat,
    getThemeMode,
    saveHeartbeatTimestamp,
    shouldSendHeartBeat,
} from './heartbeatHelper';
import { type RequiredState } from './interface';

type AppStartListening = TypedStartListening<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

const calendarSettingsHeartbeatKey = 'calendar-heartbeat-timestamp' as const;
export const calendarSettingsHeartbeatListener = (startListening: AppStartListening) => {
    startListening({
        actionCreator: bootstrapEvent,
        effect: async (_, listenerApi) => {
            if (!shouldSendHeartBeat(calendarSettingsHeartbeatKey)) {
                return;
            }

            const [calendars, calendarSettings, userSettings, user, subscription, organization] = await Promise.all([
                listenerApi.dispatch(calendarsThunk()),
                listenerApi.dispatch(calendarSettingsThunk()),
                listenerApi.dispatch(userSettingsThunk()),
                listenerApi.dispatch(userThunk()),
                listenerApi.dispatch(subscriptionThunk()),
                listenerApi.dispatch(organizationThunk()),
            ]);

            const visualCalendar = getVisualCalendars(calendars || []);
            const grouppedCalendars = groupCalendarsByTaxonomy(visualCalendar);

            if (!calendarSettings || !userSettings) {
                return;
            }

            const { DarkTheme, LightTheme, Mode } = userSettings.Theme || PROTON_DEFAULT_THEME_SETTINGS;

            void sendTelemetryReportWithBaseDimensions({
                user,
                subscription,
                userSettings,
                api: listenerApi.extra.api,
                measurementGroup: TelemetryMeasurementGroups.calendarSettingsHeartBeat,
                event: TelemetryHeartbeatEvents.calendar_heartbeat,
                dimensions: {
                    lightThemeName: PROTON_THEMES_MAP[LightTheme].label,
                    darkThemeName: PROTON_THEMES_MAP[DarkTheme].label,
                    themeMode: getThemeMode(Mode),
                    videoConference: formatBooleanForHeartbeat(organization.Settings.VideoConferencingEnabled),
                    autoDetectPrimaryTimezone: formatBooleanForHeartbeat(calendarSettings.AutoDetectPrimaryTimezone),
                    displaySecondaryTimezone: formatBooleanForHeartbeat(calendarSettings.DisplaySecondaryTimezone),
                    displayWeekNumber: formatBooleanForHeartbeat(calendarSettings.DisplayWeekNumber),
                    viewPreference: getCalendarViewPreference(calendarSettings.ViewPreference),
                    autoImportInvite: formatBooleanForHeartbeat(calendarSettings.AutoImportInvite),
                    weekStart: getWeekStart(userSettings.WeekStart),
                    ownedCalendars: getCalendarArrayLength(grouppedCalendars.ownedPersonalCalendars),
                    sharedCalendars: getCalendarArrayLength(grouppedCalendars.sharedCalendars),
                    holidaysCalendars: getCalendarArrayLength(grouppedCalendars.holidaysCalendars),
                    subscribedCalendars: getCalendarArrayLength(grouppedCalendars.subscribedCalendars),
                    unknownCalendars: getCalendarArrayLength(grouppedCalendars.unknownCalendars),
                    calendars: getCalendarArrayLength(calendars),
                },
                delay: false,
            });

            saveHeartbeatTimestamp(calendarSettingsHeartbeatKey);
        },
    });
};
