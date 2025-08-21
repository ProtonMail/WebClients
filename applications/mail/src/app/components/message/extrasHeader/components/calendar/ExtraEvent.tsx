import { useCallback, useEffect, useState } from 'react';

import { useApi, useDrawer } from '@proton/components';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { EventInvitationError } from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { INVITATION_ERROR_TYPE } from '@proton/shared/lib/calendar/icsSurgery/errors/icsSurgeryErrorTypes';
import { APPS } from '@proton/shared/lib/constants';
import { postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import type { Address, UserSettings } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import type { GetCalendarInfo } from '@proton/shared/lib/interfaces/hooks/GetCalendarInfo';
import type { GetCanonicalEmailsMap } from '@proton/shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import type { EventInvitation, InvitationModel } from '../../../../../helpers/calendar/invite';
import {
    UPDATE_ACTION,
    getEventTimeStatus,
    getHasFullCalendarData,
    getHasInvitationIcs,
    getInitialInvitationModel,
    getInvitationHasEventID,
    getIsInvitationFromFuture,
    getIsInvitationOutdated,
    getIsPartyCrasher,
    getIsProtonInvite,
    getIsReinvite,
} from '../../../../../helpers/calendar/invite';
import { fetchEventInvitation, updateEventInvitation } from '../../../../../helpers/calendar/inviteApi';
import EmailReminderWidgetSkeleton from './EmailReminderWidgetSkeleton';
import ExtraEventButtons from './ExtraEventButtons';
import ExtraEventDetails from './ExtraEventDetails';
import { ExtraEventErrorBanner } from './ExtraEventErrorBanner';
import ExtraEventHeader from './ExtraEventHeader';
import ExtraEventSummary from './ExtraEventSummary';
import ExtraEventTimeStatus from './ExtraEventTimeStatus';
import ExtraEventWarning from './ExtraEventWarning';
import useCalendarWidgetDrawerEvents from './useCalendarWidgetDrawerEvents';

import './CalendarWidget.scss';

const noErrorBannerSet = new Set([
    INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR,
    INVITATION_ERROR_TYPE.EVENT_UPDATE_ERROR,
]);

interface Props {
    message: MessageStateWithData;
    invitationOrError: EventInvitation | EventInvitationError;
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
    calendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    userSettings: UserSettings;
    getAddressKeys: GetAddressKeys;
    getCalendarInfo: GetCalendarInfo;
    getCalendarEventRaw: GetCalendarEventRaw;
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
}
const ExtraEvent = ({
    invitationOrError,
    message,
    calendars,
    defaultCalendar,
    canCreateCalendar,
    maxUserCalendarsDisabled,
    contactEmails,
    ownAddresses,
    userSettings,
    getAddressKeys,
    getCalendarInfo,
    getCalendarEventRaw,
    getCanonicalEmailsMap,
}: Props) => {
    const [model, setModel] = useState<InvitationModel>(() =>
        getInitialInvitationModel({
            invitationOrError,
            message,
            contactEmails,
            ownAddresses,
            calendar: defaultCalendar,
            hasNoCalendars: calendars.length === 0,
            canCreateCalendar,
            maxUserCalendarsDisabled,
        })
    );
    const [loading, withLoading] = useLoading(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const isMounted = useIsMounted();
    const api = useApi();
    const { appInView } = useDrawer();

    const { isOrganizerMode, invitationIcs, isPartyCrasher: isPartyCrasherIcs, pmData, invitationApi } = model;
    // setters don't need to be listed as dependencies in a callback
    const refresh = useCallback(() => {
        if (isMounted()) {
            setRetryCount((count) => count + 1);
        }
    }, []);

    const handleReloadWidget = () => {
        // set model to clean up error
        setModel(
            getInitialInvitationModel({
                invitationOrError,
                message,
                contactEmails,
                ownAddresses,
                calendar: defaultCalendar,
                hasNoCalendars: calendars.length === 0,
                canCreateCalendar,
                maxUserCalendarsDisabled,
            })
        );
        refresh();
    };

    useCalendarWidgetDrawerEvents({
        messageID: message.data.ID,
        calendarEvent: invitationApi?.calendarEvent,
        refresh,
    });

    useEffect(() => {
        const initializeEventModel = async () => {
            if (!invitationIcs?.vevent) {
                return;
            }
            let invitationApi;
            let parentInvitationApi;
            let calendarData;
            let hasDecryptionError;
            let singleEditData;
            let reencryptionData;
            let reinviteEventID;
            let isPartyCrasher = isPartyCrasherIcs;
            try {
                // check if an event with the same uid exists in the calendar already
                const {
                    invitation,
                    parentInvitation,
                    calendarData: calData,
                    calendarEvent,
                    singleEditData: singleData,
                    reencryptionData: reencryptData,
                    hasDecryptionError: hasDecryptError,
                } = await fetchEventInvitation({
                    veventComponent: invitationIcs.vevent,
                    legacyUid: invitationIcs.legacyUid,
                    api,
                    getAddressKeys,
                    getCalendarInfo,
                    getCalendarEventRaw,
                    calendars,
                    defaultCalendar,
                    message,
                    contactEmails,
                    ownAddresses,
                });
                invitationApi = invitation;
                calendarData = calData;
                singleEditData = singleData;
                reencryptionData = reencryptData;
                hasDecryptionError = hasDecryptError;
                const isOutdated = getIsInvitationOutdated({ invitationIcs, invitationApi, isOrganizerMode });
                const isFromFuture = getIsInvitationFromFuture({ invitationIcs, invitationApi, isOrganizerMode });
                const isProtonInvite = getIsProtonInvite({ invitationIcs, calendarEvent, pmData });
                const isReinvite = getIsReinvite({ invitationIcs, calendarEvent, isOrganizerMode, isOutdated });
                if (isReinvite) {
                    reinviteEventID = calendarEvent?.ID;
                    // ignore existing partstat
                    delete invitationApi?.attendee?.partstat;
                }
                if (parentInvitation) {
                    parentInvitationApi = parentInvitation;
                }
                isPartyCrasher = await getIsPartyCrasher({
                    isOrganizerMode,
                    invitationApi,
                    calendarEvent,
                    message,
                    isPartyCrasherIcs,
                });

                if (isMounted()) {
                    setModel({
                        ...model,
                        invitationIcs,
                        invitationApi,
                        parentInvitationApi,
                        isOutdated,
                        isFromFuture,
                        isProtonInvite,
                        isReinvite,
                        reinviteEventID,
                        calendarData,
                        singleEditData,
                        reencryptionData,
                        hasDecryptionError,
                        isPartyCrasher,
                    });
                }
            } catch (error: any) {
                // if fetching fails, proceed as if there was no event in the database
                return;
            }
            if (
                !invitationApi ||
                !getInvitationHasEventID(invitationApi) ||
                !getHasFullCalendarData(calendarData) ||
                calendarData?.calendarNeedsUserAction ||
                !isMounted()
            ) {
                // treat as a new invitation
                return;
            }
            // otherwise update the invitation if outdated
            try {
                const { action: updateAction, invitation: updatedInvitationApi } = await updateEventInvitation({
                    isOrganizerMode,
                    invitationIcs,
                    invitationApi,
                    api,
                    getCanonicalEmailsMap,
                    calendarData,
                    singleEditData,
                    pmData,
                    message,
                    contactEmails,
                    ownAddresses,
                    overwrite: !!hasDecryptionError,
                });

                // If we just updated the event and the calendar app is opened in the drawer,
                // we want to call the calendar event manager to refresh the view
                if (updatedInvitationApi && appInView === APPS.PROTONCALENDAR) {
                    postMessageToIframe(
                        {
                            type: DRAWER_EVENTS.CALL_CALENDAR_EVENT_MANAGER,
                            payload: { calendarID: invitationApi.calendarEvent.CalendarID },
                        },
                        APPS.PROTONCALENDAR
                    );
                }

                const newInvitationApi = updatedInvitationApi || invitationApi;
                const isOutdated =
                    updateAction !== UPDATE_ACTION.NONE
                        ? false
                        : getIsInvitationOutdated({
                              invitationIcs,
                              invitationApi: newInvitationApi,
                              isOrganizerMode,
                          });
                const isFromFuture = getIsInvitationFromFuture({
                    invitationIcs,
                    invitationApi: newInvitationApi,
                    isOrganizerMode,
                });
                const isProtonInvite = getIsProtonInvite({
                    invitationIcs,
                    calendarEvent: newInvitationApi.calendarEvent,
                    pmData,
                });
                const isReinvite = getIsReinvite({
                    invitationIcs,
                    calendarEvent: newInvitationApi.calendarEvent,
                    isOrganizerMode,
                    isOutdated,
                });
                if (isMounted()) {
                    setModel({
                        ...model,
                        invitationIcs,
                        invitationApi: newInvitationApi,
                        parentInvitationApi,
                        calendarData,
                        singleEditData,
                        reencryptionData,
                        timeStatus: getEventTimeStatus(newInvitationApi.vevent, Date.now()),
                        isOutdated,
                        isFromFuture,
                        isProtonInvite,
                        isReinvite,
                        reinviteEventID,
                        updateAction,
                        hasDecryptionError,
                        isPartyCrasher,
                    });
                }
            } catch (e: any) {
                if (isMounted()) {
                    setModel({
                        ...model,
                        invitationApi,
                        parentInvitationApi,
                        error: new EventInvitationError(INVITATION_ERROR_TYPE.UPDATING_ERROR),
                    });
                }
            }
        };

        void withLoading(initializeEventModel());
    }, [retryCount]);

    if (loading) {
        return <EmailReminderWidgetSkeleton />;
    }

    if (model.error && !noErrorBannerSet.has(model.error.type)) {
        return <ExtraEventErrorBanner error={model.error} onReload={handleReloadWidget} />;
    }

    if (!getHasInvitationIcs(model)) {
        return null;
    }

    return (
        <div data-testid="calendar-widget" className="calendar-widget mb-2">
            <ExtraEventTimeStatus model={model} />
            <div className="rounded border bg-norm overflow-auto">
                <div className="p-5">
                    <ExtraEventSummary model={model} />
                    <ExtraEventHeader model={model} />
                    <ExtraEventWarning model={model} />
                    <ExtraEventButtons
                        model={model}
                        setModel={setModel}
                        message={message}
                        reloadWidget={handleReloadWidget}
                    />
                </div>
                <ExtraEventDetails model={model} weekStartsOn={getWeekStartsOn(userSettings)} />
            </div>
        </div>
    );
};

export default ExtraEvent;
