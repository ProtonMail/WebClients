import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { noop } from 'proton-shared/lib/helpers/function';
import { LoadingMap, RequireSome } from 'proton-shared/lib/interfaces/utils';
import React from 'react';
import { Icon, InlineLinkButton, Loader, SmallButton } from 'react-components';
import { c } from 'ttag';
import { EVENT_INVITATION_ERROR_TYPE, getErrorMessage } from '../../../../helpers/calendar/EventInvitationError';
import { InvitationModel } from '../../../../helpers/calendar/invite';
import { WidgetActions } from '../../../../hooks/useWidgetButtons';

const { EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR } = EVENT_INVITATION_ERROR_TYPE;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    loadingMap: LoadingMap;
    loadingRetry: boolean;
    actions: WidgetActions;
}
const ExtraEventAttendeeButtons = ({
    model,
    loadingMap,
    loadingRetry,
    actions: { onAccept, onTentative, onDecline, onRetryCreateEvent, onRetryUpdateEvent }
}: Props) => {
    const {
        invitationIcs: { method },
        invitationApi,
        calendarData,
        error
    } = model;
    const partstat = invitationApi?.attendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
    const loadingAccept = loadingMap['accept'];
    const loadingTentative = loadingMap['tentative'];
    const loadingDecline = loadingMap['decline'];

    if (!calendarData?.calendar) {
        return (
            <div className="mb0-5">
                <SmallButton onClick={noop} disabled={true} className="mr0-5">
                    {c('Action').t`Yes`}
                </SmallButton>
                <SmallButton onClick={noop} disabled={true} className="mr0-5">
                    {c('Action').t`Maybe`}
                </SmallButton>
                <SmallButton onClick={noop} disabled={true}>
                    {c('Action').t`No`}
                </SmallButton>
            </div>
        );
    }

    if (error && [EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR].includes(error.type)) {
        const { partstat } = error;
        const message = getErrorMessage(error.type);
        const handleRetry = partstat
            ? () => (error.type === EVENT_UPDATE_ERROR ? onRetryUpdateEvent(partstat) : onRetryCreateEvent(partstat))
            : noop;

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
        const loadingAnswer = loadingAccept || loadingTentative || loadingDecline;

        return (
            <div className="mb0-5">
                <SmallButton
                    onClick={onAccept}
                    disabled={accepted || loadingAnswer}
                    loading={loadingAccept}
                    className="mr0-5"
                >
                    {c('Action').t`Yes`}
                </SmallButton>
                <SmallButton
                    onClick={onTentative}
                    disabled={tentative || loadingAnswer}
                    loading={loadingTentative}
                    className="mr0-5"
                >
                    {c('Action').t`Maybe`}
                </SmallButton>
                <SmallButton onClick={onDecline} disabled={declined || loadingAnswer} loading={loadingDecline}>
                    {c('Action').t`No`}
                </SmallButton>
            </div>
        );
    }
    return null;
};

export default ExtraEventAttendeeButtons;
