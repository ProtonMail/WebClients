import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import React from 'react';
import { c, msgid } from 'ttag';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { Icon } from 'react-components';
import { getSequence, InvitationModel } from '../../../../helpers/calendar/invite';

const { REPLY, COUNTER } = ICAL_METHOD;
const { ACCEPTED, TENTATIVE, DECLINED } = ICAL_ATTENDEE_STATUS;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventOrganizerSummary = ({ model }: Props) => {
    const { invitationIcs, invitationApi } = model;
    if (!invitationApi) {
        return null;
    }
    const { method, vevent: eventIcs, attendee: attendeeIcs, participants: participantsIcs } = invitationIcs;
    const { vevent: eventApi } = invitationApi;
    const [sequenceApi, sequenceIcs] = [eventApi, eventIcs].map(getSequence);
    const sequenceDiff = sequenceIcs - sequenceApi;
    const totalParticipants = participantsIcs?.length || 0;

    if (method === COUNTER && attendeeIcs) {
        if (sequenceDiff > 0) {
            return null;
        }
        const icon = (
            <span className="inline-flex bg-global-attention rounded50 p0-25 mr0-5r">
                <Icon name="clock" color="white" size={12} />
            </span>
        );
        if (sequenceDiff < 0) {
            return (
                <p>
                    {icon}
                    {c('Calendar invite info').ngettext(
                        msgid`You already accepted the new time proposal. The participant has been notified`,
                        `You already accepted the new time proposal. All the participants have been notified`,
                        totalParticipants
                    )}
                </p>
            );
        }
        const participantName = attendeeIcs.name;

        return (
            <p className="mt0-5 mb0-5">
                {icon}
                {c('Calendar invite info').jt`${participantName} proposed a new time for this event.`}
            </p>
        );
    }
    if (method === REPLY) {
        if (!attendeeIcs?.partstat) {
            return null;
        }
        if (!eventApi || !eventIcs['recurrence-id']) {
            return (
                <div>
                    <p className="mt0 mb0-5">{c('Calendar invite info').t`This event could not be found.`}</p>
                    <p className="mt0 mb0-5">{c('Calendar invite info').t`It might have been cancelled or updated.`}</p>
                </div>
            );
        }
        const { partstat } = attendeeIcs;
        const participantName = attendeeIcs.name;
        if (sequenceDiff === 0) {
            if (partstat === ACCEPTED) {
                const icon = (
                    <span className="inline-flex bg-global-success rounded50 p0-25 mr0-25">
                        <Icon name="on" color="white" size={12} />
                    </span>
                );
                return (
                    <p className="mt0-5 mb0-5">
                        {icon}
                        {c('Calendar invite info').jt`${participantName} accepted your invitation.`}
                    </p>
                );
            }
            if (partstat === DECLINED) {
                const icon = (
                    <span className="inline-flex bg-global-warning rounded50 p0-25 mr0-25">
                        <Icon name="off" color="white" size={12} />
                    </span>
                );
                return (
                    <p className="mt0-5 mb0-5">
                        {icon}
                        {c('Calendar invite info').jt`${participantName} declined your invitation.`}
                    </p>
                );
            }
            if (partstat === TENTATIVE) {
                const icon = (
                    <span className="inline-flex bg-global-attention rounded50 p0-25 mr0-25">
                        <Icon name="question-nocircle" color="white" size={12} />
                    </span>
                );
                return (
                    <p className="mt0-5 mb0-5">
                        {icon}
                        {c('Calendar invite info').jt`${participantName} tentatively accepted your invitation.`}
                    </p>
                );
            }
        }
        const eventUpdated = (
            <p className="mt0-5 mb0-5">
                {c('Calendar invite info').t`This invitation is out of date. This event has been updated.`}
            </p>
        );
        if (partstat === ACCEPTED) {
            const icon = (
                <span className="inline-flex bg-global-success rounded50 p0-25 mr0-25">
                    <Icon name="on" color="white" size={12} />
                </span>
            );
            return (
                <>
                    {eventUpdated}
                    <p className="mt0-5 mb0-5">
                        {icon}
                        {c('Calendar invite info').jt`${participantName} had previously accepted your invitation.`}
                    </p>
                </>
            );
        }
        if (partstat === DECLINED) {
            const icon = (
                <span className="inline-flex bg-global-warning rounded50 p0-25 mr0-25">
                    <Icon name="off" color="white" size={12} />
                </span>
            );
            return (
                <>
                    {eventUpdated}
                    <p className="mt0-5 mb0-5">
                        {icon}
                        {c('Calendar invite info').jt`${participantName} had previously declined your invitation.`}
                    </p>
                </>
            );
        }
        if (partstat === TENTATIVE) {
            const icon = (
                <span className="inline-flex bg-global-attention rounded50 p0-25 mr0-25">
                    <Icon name="question-nocircle" color="white" size={12} />
                </span>
            );
            return (
                <>
                    {eventUpdated}
                    <p className="mt0-5 mb0-5">
                        {icon}
                        {c('Calendar invite info')
                            .jt`${participantName} had previously tentatively accepted your invitation.`}
                    </p>
                </>
            );
        }
    }
    return null;
};

export default ExtraEventOrganizerSummary;
