import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { APPS } from 'proton-shared/lib/constants';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import { LoadingMap } from 'proton-shared/lib/interfaces/utils';
import React, { useMemo, Dispatch, SetStateAction } from 'react';
import { AppLink, classnames, SmallButton, useNotifications, useLoadingMap } from 'react-components';
import { c } from 'ttag';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../../../../helpers/calendar/EventInvitationError';
import {
    EventInvitation,
    getCalendarEventLink,
    getSequence,
    InvitationModel
} from '../../../../helpers/calendar/invite';
import useWidgetButtons from '../../../../hooks/useWidgetButtons';
import { MessageExtended } from '../../../../models/message';
import { RequireSome } from '../../../../models/utils';

interface WidgetActions {
    onAccept: () => void;
    onTentative: () => void;
    onDecline: () => void;
}

const getOrganizerButtons = (model: RequireSome<InvitationModel, 'invitationIcs'>, { onAccept }: WidgetActions) => {
    const {
        invitationIcs,
        invitationIcs: { method },
        invitationApi
    } = model;
    if (!invitationApi?.vevent.sequence) {
        return null;
    }
    const { vevent: eventIcs } = invitationIcs;
    const { vevent: eventApi } = invitationApi;
    const [sequenceApi, sequenceIcs] = [eventApi, eventIcs].map(getSequence);
    const sequenceDiff = sequenceIcs - sequenceApi;

    if (method === ICAL_METHOD.COUNTER) {
        if (sequenceDiff === 0) {
            return <SmallButton onClick={onAccept}>{c('Action').t`Accept`}</SmallButton>;
        }
        if (sequenceDiff < 0) {
            return <SmallButton disabled={true}>{c('Action').t`Accept`}</SmallButton>;
        }
    }
    return null;
};

const getAttendeeButtons = (
    model: RequireSome<InvitationModel, 'invitationIcs'>,
    loadingMap: LoadingMap,
    { onAccept, onTentative, onDecline }: WidgetActions
) => {
    const {
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
        calendarData
    } = model;
    const partstat = (invitationApi?.attendee || invitationIcs.attendee)?.partstat;
    const loadingAccept = loadingMap['accept'];
    const loadingTentative = loadingMap['tentative'];
    const loadingDecline = loadingMap['decline'];

    if (!calendarData?.calendar) {
        return 'Create a calendar to get widget buttons :-P';
    }

    if (method === ICAL_METHOD.REQUEST && partstat) {
        const hasReplied = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
        const accepted = hasReplied && partstat === ICAL_ATTENDEE_STATUS.ACCEPTED;
        const tentative = hasReplied && partstat === ICAL_ATTENDEE_STATUS.TENTATIVE;
        const declined = hasReplied && partstat === ICAL_ATTENDEE_STATUS.DECLINED;

        return (
            <>
                <SmallButton
                    onClick={onAccept}
                    disabled={accepted || loadingAccept}
                    loading={loadingAccept}
                    className="mr0-5"
                >
                    {c('Action').t`Yes`}
                </SmallButton>
                <SmallButton
                    onClick={onTentative}
                    disabled={tentative || loadingTentative}
                    loading={loadingTentative}
                    className="mr0-5"
                >
                    {c('Action').t`Maybe`}
                </SmallButton>
                <SmallButton onClick={onDecline} disabled={declined || loadingDecline} loading={loadingDecline}>
                    {c('Action').t`No`}
                </SmallButton>
            </>
        );
    }
    return null;
};

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
    message: MessageExtended;
    config: ProtonConfig;
}
const ExtraEventButtons = ({ model, setModel, message, config }: Props) => {
    const { createNotification } = useNotifications();
    const [loadingMap, withLoadingMap] = useLoadingMap();

    const throwUnexpectedError = () => {
        setModel({
            ...model,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR)
        });
    };
    const handleInvitationSent = (invitationApi: RequireSome<EventInvitation, 'eventID'>) => {
        setModel({
            ...model,
            invitationApi,
            hideSummary: true
        });
        createNotification({ type: 'success', text: c('Info').t`Answer sent` });
    };
    const { accept, acceptTentatively, decline } = useWidgetButtons({
        model,
        message,
        config,
        onUnexpectedError: throwUnexpectedError,
        onSuccess: handleInvitationSent
    });
    const actions = {
        onAccept: async () => withLoadingMap({ accept: accept() }),
        onTentative: async () => withLoadingMap({ tentative: acceptTentatively() }),
        onDecline: async () => withLoadingMap({ decline: decline() })
    };

    const { isOrganizerMode, invitationApi } = model;

    const buttons = useMemo(() => {
        return isOrganizerMode ? getOrganizerButtons(model, actions) : getAttendeeButtons(model, loadingMap, actions);
    }, [model, loadingMap, actions]);
    const displayBorderBottom = !!(buttons || invitationApi);
    const link = useMemo(() => getCalendarEventLink(model), [model]);

    return (
        <div className={classnames(['pt0-5 mt0-5 mb0-5 border-top', displayBorderBottom && 'border-bottom'])}>
            <div className="mb0-5">{buttons}</div>
            {invitationApi && link && (
                <div className="mb0-5">
                    <AppLink to={link} toApp={APPS.PROTONCALENDAR}>
                        {c('Link').t`Open in ProtonCalendar`}
                    </AppLink>
                </div>
            )}
        </div>
    );
};

export default ExtraEventButtons;
