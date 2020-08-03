import { ICAL_METHOD, ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import React from 'react';
import { SmallButton } from 'react-components';
import { c } from 'ttag';
import { getSequence, InvitationModel } from '../../../../helpers/calendar/invite';
import { RequireSome } from '../../../../models/utils';

const getOrganizerButtons = (model: RequireSome<InvitationModel, 'invitationIcs'>, onAccept: () => void) => {
    const { invitationIcs, invitationApi, method } = model;
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
    onAccept: () => void,
    onDecline: () => void,
    onMaybe: () => void
) => {
    const {
        method,
        invitationIcs: { attendee: { partstat } = {} }
    } = model;

    if (method === ICAL_METHOD.REQUEST && partstat) {
        const hasReplied = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
        const accepted = hasReplied && partstat === ICAL_ATTENDEE_STATUS.ACCEPTED;
        const tentative = hasReplied && partstat === ICAL_ATTENDEE_STATUS.TENTATIVE;
        const declined = hasReplied && partstat === ICAL_ATTENDEE_STATUS.DECLINED;

        return (
            <>
                <SmallButton onClick={onAccept} disabled={accepted} className="mr0-5">
                    {c('Action').t`Yes`}
                </SmallButton>
                <SmallButton onClick={onMaybe} disabled={tentative} className="mr0-5">
                    {c('Action').t`Maybe`}
                </SmallButton>
                <SmallButton onClick={onDecline} disabled={declined}>
                    {c('Action').t`No`}
                </SmallButton>
            </>
        );
    }
    return null;
};

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventButtons = ({ model }: Props) => {
    const { isOrganizerMode, invitationApi } = model;

    const onAccept = () => {
        // TODO
    };
    const onDecline = () => {
        // TODO
    };
    const onMaybe = () => {
        // TODO
    };

    return (
        <div className="pt0-5 mt0-5 mb0-5 border-top border-bottom">
            <div className="mb0-5">
                {isOrganizerMode
                    ? getOrganizerButtons(model, onAccept)
                    : getAttendeeButtons(model, onAccept, onDecline, onMaybe)}
            </div>
            {invitationApi && (
                <div className="mb0-5">
                    <a href="#" className="bold">{c('Link').t`Open in ProtonCalendar`}</a>
                </div>
            )}
        </div>
    );
};

export default ExtraEventButtons;
