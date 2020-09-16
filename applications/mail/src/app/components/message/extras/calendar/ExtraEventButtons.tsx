import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { APPS } from 'proton-shared/lib/constants';
import { noop } from 'proton-shared/lib/helpers/function';
import { omit } from 'proton-shared/lib/helpers/object';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import { LoadingMap } from 'proton-shared/lib/interfaces/utils';
import React, { Dispatch, SetStateAction, useMemo } from 'react';
import {
    AppLink,
    classnames,
    Icon,
    InlineLinkButton,
    Loader,
    SmallButton,
    useLoading,
    useLoadingMap,
} from 'react-components';
import { c } from 'ttag';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
    getErrorMessage
} from '../../../../helpers/calendar/EventInvitationError';
import {
    EVENT_TIME_STATUS,
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
    onRetryCreateEvent: (partstat: ICAL_ATTENDEE_STATUS) => void;
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
    loadingRetry: boolean,
    { onAccept, onTentative, onDecline, onRetryCreateEvent }: WidgetActions
) => {
    const {
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
        calendarData,
        timeStatus,
        error
    } = model;
    const partstat = (invitationApi?.attendee || invitationIcs.attendee)?.partstat;
    const loadingAccept = loadingMap['accept'];
    const loadingTentative = loadingMap['tentative'];
    const loadingDecline = loadingMap['decline'];

    if (!calendarData?.calendar) {
        return 'Create a calendar to get widget buttons :-P';
    }

    if (timeStatus !== EVENT_TIME_STATUS.FUTURE) {
        return null;
    }

    if (error?.type === EVENT_INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR) {
        const { partstat } = error;
        const message = getErrorMessage(error.type);
        const handleRetry = partstat ? () => onRetryCreateEvent(partstat) : noop;

        if (loadingRetry) {
            return <Loader className="center flex mt1 mb1 " />;
        }

        return (
            <div className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
                <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
                <span className="pl0-5 pr0-5 flex-item-fluid">{message}</span>
                <span className="flex-item-noshrink flex">
                    <InlineLinkButton onClick={handleRetry} className="underline color-currentColor">
                        {c('Action').t`Try again`}
                    </InlineLinkButton>
                </span>
            </div>
        );
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
    const [loadingMap, withLoadingMap] = useLoadingMap();
    const [loadingRetry, withLoadingRetry] = useLoading();

    const throwUnexpectedError = () => {
        setModel({
            ...model,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR)
        });
    };
    const handleCreateEventError = (partstat: ICAL_ATTENDEE_STATUS) => {
        setModel({
            ...model,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR, { partstat })
        });
    };
    const handleSuccess = (invitationApi: RequireSome<EventInvitation, 'calendarEvent'>) => {
        setModel({
            ...omit(model, ['error']),
            invitationApi,
            hideSummary: true
        });
    };
    const handlePastEvent = (timeStatus: EVENT_TIME_STATUS) => {
        setModel({
            ...model,
            timeStatus
        });
    };

    const { accept, acceptTentatively, decline, retryCreateEvent } = useWidgetButtons({
        model,
        message,
        config,
        onUnexpectedError: throwUnexpectedError,
        onSuccess: handleSuccess,
        onCreateEventError: handleCreateEventError,
        onPastEvent: handlePastEvent
    });
    const actions = {
        onAccept: async () => withLoadingMap({ accept: accept() }),
        onTentative: async () => withLoadingMap({ tentative: acceptTentatively() }),
        onDecline: async () => withLoadingMap({ decline: decline() }),
        onRetryCreateEvent: async (partstat: ICAL_ATTENDEE_STATUS) => withLoadingRetry(retryCreateEvent(partstat))
    };

    const { isOrganizerMode, invitationApi } = model;

    const buttons = useMemo(() => {
        return isOrganizerMode
            ? getOrganizerButtons(model, actions)
            : getAttendeeButtons(model, loadingMap, loadingRetry, actions);
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
