import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { omit } from 'proton-shared/lib/helpers/object';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React, { Dispatch, SetStateAction } from 'react';
import { classnames, useLoading, useLoadingMap } from 'react-components';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../../../../helpers/calendar/EventInvitationError';
import {
    UPDATE_ACTION,
    EventInvitation,
    getCalendarEventLink,
    getDoNotDisplayButtons,
    InvitationModel
} from '../../../../helpers/calendar/invite';
import useWidgetButtons from '../../../../hooks/useWidgetButtons';
import { MessageExtended } from '../../../../models/message';
import ExtraEventAlert from './ExtraEventAlert';
import ExtraEventAttendeeButtons from './ExtraEventAttendeeButtons';
import ExtraEventLink from './ExtraEventLink';
import ExtraEventOrganizerButtons from './ExtraEventOrganizerButtons';

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
            hideLink: true,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR, { partstat })
        });
    };
    const handleUpdateEventError = (partstat: ICAL_ATTENDEE_STATUS) => {
        setModel({
            ...model,
            hideLink: true,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.EVENT_UPDATE_ERROR, { partstat })
        });
    };
    const handleSuccess = (invitationApi: RequireSome<EventInvitation, 'calendarEvent' | 'attendee'>) => {
        setModel({
            ...omit(model, ['error']),
            invitationApi,
            hideSummary: true,
            hideLink: false,
            updateAction: UPDATE_ACTION.NONE
        });
    };

    const { accept, acceptTentatively, decline, retryCreateEvent, retryUpdateEvent } = useWidgetButtons({
        model,
        message,
        config,
        onUnexpectedError: throwUnexpectedError,
        onSuccess: handleSuccess,
        onCreateEventError: handleCreateEventError,
        onUpdateEventError: handleUpdateEventError
    });
    const actions = {
        onAccept: async () => withLoadingMap({ accept: accept() }),
        onTentative: async () => withLoadingMap({ tentative: acceptTentatively() }),
        onDecline: async () => withLoadingMap({ decline: decline() }),
        onRetryCreateEvent: async (partstat: ICAL_ATTENDEE_STATUS) => withLoadingRetry(retryCreateEvent(partstat)),
        onRetryUpdateEvent: async (partstat: ICAL_ATTENDEE_STATUS) => withLoadingRetry(retryUpdateEvent(partstat))
    };

    const { isOrganizerMode } = model;
    const buttons = getDoNotDisplayButtons(model) ? null : isOrganizerMode ? (
        <ExtraEventOrganizerButtons model={model} actions={actions} />
    ) : (
        <ExtraEventAttendeeButtons
            model={model}
            loadingMap={loadingMap}
            loadingRetry={loadingRetry}
            actions={actions}
        />
    );
    const { to, text } = getCalendarEventLink(model);
    const displayBorderBottom = to !== undefined || !!buttons;

    return (
        <div className={classnames(['pt0-5 mt0-5 mb0-5 border-top', displayBorderBottom && 'border-bottom'])}>
            {buttons}
            <ExtraEventAlert model={model} />
            <ExtraEventLink to={to} text={text} />
        </div>
    );
};

export default ExtraEventButtons;
