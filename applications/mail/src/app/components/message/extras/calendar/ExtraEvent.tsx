import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { Address, UserSettings } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { getWeekStartsOn } from 'proton-shared/lib/settings/helper';
import React, { useEffect, useState } from 'react';
import {
    Icon,
    InlineLinkButton,
    Loader,
    useApi,
    useGetCalendarEventRaw,
    useGetCalendarInfo,
    useLoading
} from 'react-components';
import { c } from 'ttag';
import useGetCalendarEventPersonal from 'react-components/hooks/useGetCalendarEventPersonal';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
    getErrorMessage
} from '../../../../helpers/calendar/EventInvitationError';
import {
    EventInvitation,
    getEventTimeStatus,
    getHasFullCalendarData,
    getHasInvitation,
    getInitialInvitationModel,
    getInvitationHasAttendee,
    getInvitationHasEventID,
    getIsInvitationOutdated,
    InvitationModel,
    UPDATE_ACTION
} from '../../../../helpers/calendar/invite';
import { fetchEventInvitation, updateEventInvitation } from '../../../../helpers/calendar/inviteApi';

import { MessageExtended } from '../../../../models/message';
import ExtraEventButtons from './ExtraEventButtons';
import ExtraEventDetails from './ExtraEventDetails';
import ExtraEventSummary from './ExtraEventSummary';
import ExtraEventWarning from './ExtraEventWarning';

const {
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    CANCELLATION_ERROR,
    EVENT_CREATION_ERROR,
    EVENT_UPDATE_ERROR
} = EVENT_INVITATION_ERROR_TYPE;

interface Props {
    message: MessageExtended;
    invitationOrError: RequireSome<EventInvitation, 'method'> | EventInvitationError;
    calendars: Calendar[];
    canCreateCalendar: boolean;
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
    contactEmails,
    ownAddresses,
    userSettings
}: Props) => {
    const [model, setModel] = useState<InvitationModel>(() =>
        getInitialInvitationModel({
            invitationOrError,
            message,
            contactEmails,
            ownAddresses,
            calendar: defaultCalendar,
            hasNoCalendars: calendars.length === 0,
            canCreateCalendar
        })
    );
    const [loading, withLoading] = useLoading(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const api = useApi();
    const getCalendarInfo = useGetCalendarInfo();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const getCalendarEventPersonal = useGetCalendarEventPersonal();

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
                canCreateCalendar
            })
        );
        return;
    };

    const { isOrganizerMode, invitationIcs, isAddressDisabled } = model;
    const method = model.invitationIcs?.method;
    const title = getDisplayTitle(invitationIcs?.vevent.summary?.value);

    useEffect(() => {
        let unmounted = false;
        const run = async () => {
            if (!invitationIcs?.vevent) {
                return;
            }
            let invitationApi;
            let parentInvitationApi;
            let calendarData;
            try {
                // check if an event with the same uid exists in the calendar already
                const { invitation, parentInvitation, calendarData: calData } = await fetchEventInvitation({
                    veventComponent: invitationIcs.vevent,
                    api,
                    getCalendarInfo,
                    getCalendarEventRaw,
                    getCalendarEventPersonal,
                    calendars,
                    defaultCalendar,
                    message,
                    contactEmails,
                    ownAddresses
                });
                invitationApi = invitation;
                calendarData = calData;
                const isOutdated = getIsInvitationOutdated(invitationIcs.vevent, invitationApi?.vevent);
                if (parentInvitation) {
                    parentInvitationApi = parentInvitation;
                }
                !unmounted && setModel({ ...model, isOutdated, calendarData });
            } catch (error) {
                // if fetching fails, proceed as if there was no event in the database
                return;
            }
            if (
                !invitationApi ||
                !getInvitationHasEventID(invitationApi) ||
                !getInvitationHasAttendee(invitationApi) ||
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
                    invitationIcs,
                    invitationApi,
                    api,
                    calendarData,
                    isAddressDisabled,
                    message,
                    contactEmails,
                    ownAddresses
                });
                const newInvitationApi = updatedInvitationApi ? updatedInvitationApi : invitationApi;
                const isOutdated =
                    updateAction !== UPDATE_ACTION.NONE
                        ? false
                        : getIsInvitationOutdated(invitationIcs.vevent, newInvitationApi.vevent);
                !unmounted &&
                    setModel({
                        ...model,
                        invitationApi: newInvitationApi,
                        parentInvitationApi,
                        calendarData,
                        timeStatus: getEventTimeStatus(newInvitationApi.vevent, Date.now()),
                        isOutdated,
                        updateAction
                    });
            } catch (e) {
                !unmounted &&
                    setModel({
                        ...model,
                        invitationApi,
                        parentInvitationApi,
                        error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR)
                    });
            }
        };
        withLoading(run());

        return () => {
            unmounted = true;
        };
    }, [retryCount]);

    if (loading) {
        return (
            <div className="rounded bordered bg-white-dm mb1 pl1 pr1 pt0-5 pb0-5">
                <Loader />
            </div>
        );
    }

    if (model.error && ![EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR].includes(model.error.type)) {
        const message = getErrorMessage(model.error.type);
        const canTryAgain = [DECRYPTION_ERROR, FETCHING_ERROR, UPDATING_ERROR, CANCELLATION_ERROR].includes(
            model.error.type
        );

        return (
            <div className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
                <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
                <span className="pl0-5 pr0-5 flex-item-fluid">{message}</span>
                {canTryAgain && (
                    <span className="flex-item-noshrink flex">
                        <InlineLinkButton onClick={handleRetry} className="underline color-currentColor">
                            {c('Action').t`Try again`}
                        </InlineLinkButton>
                    </span>
                )}
            </div>
        );
    }

    if ((isOrganizerMode && method === ICAL_METHOD.REFRESH) || !getHasInvitation(model)) {
        return null;
    }

    const interactiveWidget = FEATURE_FLAGS.includes('calendar-invitations');

    return (
        <div className="rounded bordered bg-white-dm mb1 pl1 pr1 pt0-5 pb0-5">
            <header className="flex flex-nowrap flex-items-center">
                <Icon name="calendar" className="mr0-5 flex-item-noshrink" />
                <strong className="ellipsis flex-item-fluid" title={title}>
                    {title}
                </strong>
            </header>
            {!interactiveWidget && <div className="pt0-5 mt0-5 mb0-5 border-top" />}
            {interactiveWidget && <ExtraEventSummary model={model} />}
            {interactiveWidget && <ExtraEventWarning model={model} />}
            {interactiveWidget && <ExtraEventButtons model={model} setModel={setModel} message={message} />}
            <ExtraEventDetails model={model} weekStartsOn={getWeekStartsOn(userSettings)} />
        </div>
    );
};

export default ExtraEvent;
