import { Address, UserSettings } from '@proton/shared/lib/interfaces';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { useEffect, useState } from 'react';
import {
    Banner,
    InlineLinkButton,
    useApi,
    useGetCalendarEventRaw,
    useGetCalendarInfo,
    useLoading,
    useCalendarEmailNotificationsFeature,
} from '@proton/components';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { c } from 'ttag';
import useGetCalendarEventPersonal from '@proton/components/hooks/useGetCalendarEventPersonal';
import { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import {
    EventInvitation,
    getEventTimeStatus,
    getHasFullCalendarData,
    getHasInvitation,
    getInitialInvitationModel,
    getInvitationHasEventID,
    getIsInvitationFromFuture,
    getIsReinvite,
    getIsInvitationOutdated,
    InvitationModel,
    UPDATE_ACTION,
} from '../../../../helpers/calendar/invite';
import { fetchEventInvitation, updateEventInvitation } from '../../../../helpers/calendar/inviteApi';

import { MessageExtendedWithData } from '../../../../models/message';
import ExtraEventButtons from './ExtraEventButtons';
import ExtraEventDetails from './ExtraEventDetails';
import ExtraEventHeader from './ExtraEventHeader';
import ExtraEventSummary from './ExtraEventSummary';
import ExtraEventWarning from './ExtraEventWarning';
import EmailReminderWidgetSkeleton from './EmailReminderWidgetSkeleton';

import './CalendarWidget.scss';

const {
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    CANCELLATION_ERROR,
    EVENT_CREATION_ERROR,
    EVENT_UPDATE_ERROR,
} = EVENT_INVITATION_ERROR_TYPE;

interface Props {
    message: MessageExtendedWithData;
    invitationOrError: EventInvitation | EventInvitationError;
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
    mustReactivateCalendars: boolean;
    calendars: Calendar[];
    defaultCalendar?: Calendar;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    userSettings: UserSettings;
}
const ExtraEvent = ({
    invitationOrError,
    message,
    calendars,
    defaultCalendar,
    canCreateCalendar,
    maxUserCalendarsDisabled,
    mustReactivateCalendars,
    contactEmails,
    ownAddresses,
    userSettings,
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
            mustReactivateCalendars,
        })
    );
    const [loading, withLoading] = useLoading(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const api = useApi();
    const enabledEmailNotifications = useCalendarEmailNotificationsFeature();
    const getCalendarInfo = useGetCalendarInfo();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const getCalendarEventPersonal = useGetCalendarEventPersonal();
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();

    const handleRetry = () => {
        setRetryCount((count) => count + 1);
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
                mustReactivateCalendars,
            })
        );
    };

    const { isOrganizerMode, invitationIcs, isPartyCrasher: isPartyCrasherIcs, pmData } = model;

    useEffect(() => {
        let unmounted = false;
        const run = async () => {
            if (!invitationIcs?.vevent) {
                return;
            }
            let invitationApi;
            let parentInvitationApi;
            let calendarData;
            let hasDecryptionError;
            let singleEditData;
            let reinviteEventID;
            let isPartyCrasher = isPartyCrasherIcs;
            const supportedInvitationIcs = invitationIcs;
            try {
                // check if an event with the same uid exists in the calendar already
                const {
                    invitation,
                    parentInvitation,
                    calendarData: calData,
                    singleEditData: singleData,
                    hasDecryptionError: hasDecryptError,
                    supportedRecurrenceId,
                } = await fetchEventInvitation({
                    veventComponent: invitationIcs.vevent,
                    api,
                    getCalendarInfo,
                    getCalendarEventRaw,
                    getCalendarEventPersonal,
                    calendars,
                    defaultCalendar,
                    message,
                    contactEmails,
                    ownAddresses,
                });
                invitationApi = invitation;
                calendarData = calData;
                singleEditData = singleData;
                hasDecryptionError = hasDecryptError;
                if (getIsReinvite({ invitationIcs, invitationApi, isOrganizerMode })) {
                    reinviteEventID = invitationApi?.calendarEvent.ID;
                    // ignore existing partstat
                    delete invitationApi?.attendee?.partstat;
                }
                const isOutdated = getIsInvitationOutdated({ invitationIcs, invitationApi, isOrganizerMode });
                const isFromFuture = getIsInvitationFromFuture({ invitationIcs, invitationApi, isOrganizerMode });
                if (parentInvitation) {
                    parentInvitationApi = parentInvitation;
                }
                if (supportedRecurrenceId) {
                    supportedInvitationIcs.vevent['recurrence-id'] = supportedRecurrenceId;
                }
                if (isOrganizerMode && invitation) {
                    isPartyCrasher = !invitation.attendee;
                }
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationIcs: supportedInvitationIcs,
                        invitationApi,
                        parentInvitationApi,
                        isOutdated,
                        isFromFuture,
                        reinviteEventID,
                        calendarData,
                        singleEditData,
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
                calendarData.calendarNeedsUserAction ||
                unmounted
            ) {
                // treat as a new invitation
                return;
            }
            // otherwise update the invitation if outdated
            try {
                const { action: updateAction, invitation: updatedInvitationApi } = await updateEventInvitation({
                    isOrganizerMode,
                    invitationIcs: supportedInvitationIcs,
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
                    enabledEmailNotifications,
                });
                const newInvitationApi = updatedInvitationApi || invitationApi;
                const isOutdated =
                    updateAction !== UPDATE_ACTION.NONE
                        ? false
                        : getIsInvitationOutdated({
                              invitationIcs: supportedInvitationIcs,
                              invitationApi: newInvitationApi,
                              isOrganizerMode,
                          });
                const isFromFuture = getIsInvitationFromFuture({
                    invitationIcs: supportedInvitationIcs,
                    invitationApi: newInvitationApi,
                    isOrganizerMode,
                });
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationIcs: supportedInvitationIcs,
                        invitationApi: newInvitationApi,
                        parentInvitationApi,
                        calendarData,
                        singleEditData,
                        timeStatus: getEventTimeStatus(newInvitationApi.vevent, Date.now()),
                        isOutdated,
                        isFromFuture,
                        reinviteEventID,
                        updateAction,
                        hasDecryptionError,
                        isPartyCrasher,
                    });
                }
            } catch (e: any) {
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationApi,
                        parentInvitationApi,
                        error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR),
                    });
                }
            }
        };

        void withLoading(run());

        return () => {
            unmounted = true;
        };
    }, [retryCount]);

    if (loading) {
        return <EmailReminderWidgetSkeleton />;
    }

    if (model.error && ![EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR].includes(model.error.type)) {
        const { message } = model.error;
        const canTryAgain = [DECRYPTION_ERROR, FETCHING_ERROR, UPDATING_ERROR, CANCELLATION_ERROR].includes(
            model.error.type
        );

        return (
            <Banner
                backgroundColor={BannerBackgroundColor.DANGER}
                icon="triangle-exclamation"
                action={
                    canTryAgain && (
                        <span className="flex-item-noshrink flex">
                            <InlineLinkButton onClick={handleRetry} className="text-underline color-inherit">
                                {c('Action').t`Try again`}
                            </InlineLinkButton>
                        </span>
                    )
                }
            >
                {message}
            </Banner>
        );
    }

    if (!getHasInvitation(model)) {
        return null;
    }

    return (
        <div className="calendar-widget rounded bordered bg-norm mb0-5 scroll-if-needed">
            <div className="p1-5">
                <ExtraEventSummary model={model} />
                <ExtraEventHeader model={model} />
                <ExtraEventWarning model={model} />
                <ExtraEventButtons model={model} setModel={setModel} message={message} />
            </div>
            <hr className="m0" />
            <ExtraEventDetails model={model} weekStartsOn={getWeekStartsOn(userSettings)} />
        </div>
    );
};

export default ExtraEvent;
