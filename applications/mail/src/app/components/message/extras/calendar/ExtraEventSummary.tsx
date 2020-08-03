import React from 'react';
import { Icon } from 'react-components';
import { c, msgid } from 'ttag';
import { ICAL_METHOD, ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { getSequence, InvitationModel } from '../../../../helpers/calendar/invite';
import { RequireSome } from '../../../../models/utils';

const { REQUEST, REPLY, CANCEL, COUNTER, DECLINECOUNTER } = ICAL_METHOD;
const { NEEDS_ACTION, ACCEPTED, TENTATIVE, DECLINED } = ICAL_ATTENDEE_STATUS;
const { REQUIRED, OPTIONAL } = ICAL_ATTENDEE_ROLE;

const getOrganizerSummary = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const { invitationIcs, invitationApi, method } = model;
    if (!invitationApi) {
        return null;
    }
    const { vevent: eventIcs, attendee: attendeeIcs, participants: participantsIcs } = invitationIcs;
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
                    <p className="mt0 mb0-5">{c('Calendar invite info').jt`This event could not be found.`}</p>
                    <p className="mt0 mb0-5">{c('Calendar invite info')
                        .jt`It might have been cancelled or updated.`}</p>
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
                        {c('Calendar invite info').t`${participantName} accepted your invitation.`}
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
                        {c('Calendar invite info').t`${participantName} declined your invitation.`}
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
                        {c('Calendar invite info').t`${participantName} tentatively accepted your invitation.`}
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
                        {c('Calendar invite info').t`${participantName} had previously accepted your invitation.`}
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
                        {c('Calendar invite info').t`${participantName} had previously declined your invitation.`}
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
                            .t`${participantName} had previously tentatively accepted your invitation.`}
                    </p>
                </>
            );
        }
    }
    return null;
};

const getAttendeeSummary = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const { invitationIcs, invitationApi, method } = model;
    const { vevent: eventIcs, attendee: attendeeIcs } = invitationIcs;
    const eventApi = invitationApi?.vevent;

    if (method === DECLINECOUNTER && attendeeIcs) {
        return (
            <div>
                <p className="mt0 mb0-5">
                    {c('Calendar invite info').jt`Your new time proposal has been declined by the organizer.`}
                </p>
                <p className="mt0 mb0-5">
                    {c('Calendar invite info').jt`The event will take place as initially scheduled.`}
                </p>
            </div>
        );
    }
    if (method === REQUEST) {
        if (eventApi && getSequence(eventIcs) - getSequence(eventApi) < 0) {
            return (
                <p className="mt0 mb0-5">
                    {c('Calendar invite info').jt`This invitation is out of date. This event has been updated.`}
                </p>
            );
        }
        if (!attendeeIcs?.partstat || !attendeeIcs.role) {
            return null;
        }
        const { partstat, role } = attendeeIcs;
        if (partstat === NEEDS_ACTION) {
            if (role === REQUIRED) {
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is required.`}
                    </p>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is optional.`}
                    </p>
                );
            }
        }
        if (partstat === ACCEPTED) {
            if (role === REQUIRED) {
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is required.
                        You already accepted this meeting invite.`}
                    </p>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is optional.
                        You already accepted this meeting time.`}
                    </p>
                );
            }
        }
        if (partstat === TENTATIVE) {
            if (role === REQUIRED) {
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is required.
                        You already tentatively accepted this meeting invite.`}
                    </p>
                );
            }
            if (role === OPTIONAL) {
                const boldOptional = (
                    <strong key="optional">{c('Calendar invite info (part of sentence)').t`optional`}</strong>
                );
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is ${boldOptional}.
                        You already tentatively accepted this meeting time.`}
                    </p>
                );
            }
        }
        if (partstat === DECLINED) {
            if (role === REQUIRED) {
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is required.
                        You already declined this meeting invite.`}
                    </p>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <p className="mt0 mb0-5">
                        {c('Calendar invite info').jt`Your attendance to this meeting is optional.
                        You already declined this meeting time.`}
                    </p>
                );
            }
        }
    }
    if (method === CANCEL) {
        return <p className="mt0 mb0-5">{c('Calendar invite info').jt`This event has been cancelled.`}</p>;
    }
    return null;
};

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventSummary = ({ model }: Props) => {
    return model.isOrganizerMode ? getOrganizerSummary(model) : getAttendeeSummary(model);
};

export default ExtraEventSummary;
