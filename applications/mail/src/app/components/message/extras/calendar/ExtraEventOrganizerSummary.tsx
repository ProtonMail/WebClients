import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import React from 'react';
import { c } from 'ttag';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { InvitationModel } from '../../../../helpers/calendar/invite';
import { getSummaryParagraph } from './ExtraEventSummary';

const { REPLY, COUNTER, REFRESH } = ICAL_METHOD;
const { ACCEPTED, TENTATIVE, DECLINED } = ICAL_ATTENDEE_STATUS;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventOrganizerSummary = ({ model }: Props) => {
    const {
        invitationIcs: { method, attendee: attendeeIcs, vevent: veventIcs },
        invitationApi,
        hasNoCalendars,
        isOutdated,
    } = model;
    const isSingleEdit = !!veventIcs['recurrence-id'];

    if (method === REPLY) {
        if (!invitationApi) {
            if (hasNoCalendars) {
                return getSummaryParagraph(
                    c('Calendar invite info').t`This response is out of date. You have no calendars.`
                );
            }
            return getSummaryParagraph(
                c('Calendar invite info')
                    .t`This response is out of date. The event does not exist in your calendar anymore.`
            );
        }

        if (!attendeeIcs?.partstat) {
            return null;
        }
        const { partstat } = attendeeIcs;
        const participantName = attendeeIcs.displayName;
        if (!isOutdated) {
            if (partstat === ACCEPTED) {
                if (isSingleEdit) {
                    return getSummaryParagraph(
                        c('Calendar invite info')
                            .jt`${participantName} accepted your invitation to one occurrence of the event.`
                    );
                }
                return getSummaryParagraph(c('Calendar invite info').jt`${participantName} accepted your invitation.`);
            }
            if (partstat === DECLINED) {
                if (isSingleEdit) {
                    return getSummaryParagraph(
                        c('Calendar invite info')
                            .jt`${participantName} declined your invitation to one occurrence of the event.`
                    );
                }
                return getSummaryParagraph(c('Calendar invite info').jt`${participantName} declined your invitation.`);
            }
            if (partstat === TENTATIVE) {
                if (isSingleEdit) {
                    return getSummaryParagraph(
                        c('Calendar invite info')
                            .jt`${participantName} tentatively accepted your invitation to one occurrence of the event.`
                    );
                }
                return getSummaryParagraph(
                    c('Calendar invite info').jt`${participantName} tentatively accepted your invitation.`
                );
            }
        }
        const eventUpdated = getSummaryParagraph(
            c('Calendar invite info').t`This response is out of date. This event has been updated.`
        );
        if (partstat === ACCEPTED) {
            if (isSingleEdit) {
                return (
                    <>
                        {eventUpdated}
                        {getSummaryParagraph(
                            c('Calendar invite info')
                                .jt`${participantName} had previously accepted your invitation to one occurrence of the event.`
                        )}
                    </>
                );
            }
            return (
                <>
                    {eventUpdated}
                    {getSummaryParagraph(
                        c('Calendar invite info').jt`${participantName} had previously accepted your invitation.`
                    )}
                </>
            );
        }
        if (partstat === DECLINED) {
            if (isSingleEdit) {
                return (
                    <>
                        {eventUpdated}
                        {getSummaryParagraph(
                            c('Calendar invite info')
                                .jt`${participantName} had previously declined your invitation to one occurrence of the event.`
                        )}
                    </>
                );
            }
            return (
                <>
                    {eventUpdated}
                    {getSummaryParagraph(
                        c('Calendar invite info').jt`${participantName} had previously declined your invitation.`
                    )}
                </>
            );
        }
        if (partstat === TENTATIVE) {
            if (isSingleEdit) {
                return (
                    <>
                        {eventUpdated}
                        <p className="mt0-5 mb0-5">
                            {c('Calendar invite info')
                                .jt`${participantName} had previously tentatively accepted your invitation to one occurrence of the event.`}
                        </p>
                    </>
                );
            }
            return (
                <>
                    {eventUpdated}
                    <p className="mt0-5 mb0-5">
                        {c('Calendar invite info')
                            .jt`${participantName} had previously tentatively accepted your invitation.`}
                    </p>
                </>
            );
        }
    }

    if (method === COUNTER && attendeeIcs) {
        const { displayName: participantName, partstat } = attendeeIcs;
        const hasAlsoReplied = partstat && [ACCEPTED, TENTATIVE, DECLINED].includes(partstat);
        if (!invitationApi) {
            if (hasNoCalendars) {
                if (isSingleEdit) {
                    return getSummaryParagraph(c('Calendar invite info')
                        .jt`${participantName} had proposed a new time for one occurrence of this event.
                        This proposal is out of date. You have no calendars.`);
                }
                return getSummaryParagraph(c('Calendar invite info')
                    .jt`${participantName} had proposed a new time for this event. This proposal is out of date.
                    You have no calendars.`);
            }
            if (isSingleEdit) {
                return getSummaryParagraph(c('Calendar invite info')
                    .jt`${participantName} had proposed a new time for one occurrence of this event. This proposal is out of date.
                    The event does not exist in your calendar anymore.`);
            }
            return getSummaryParagraph(c('Calendar invite info')
                .jt`${participantName} had proposed a new time for this event. This proposal is out of date.
                The event does not exist in your calendar anymore.`);
        }
        if (isOutdated) {
            if (hasAlsoReplied) {
                if (partstat === ACCEPTED) {
                    if (isSingleEdit) {
                        return getSummaryParagraph(c('Calendar invite info')
                            .jt`${participantName} had accepted your invitation and proposed a new time for one occurrence of this event.
                            Answer and proposal are out of date.`);
                    }
                    return getSummaryParagraph(c('Calendar invite info')
                        .jt`${participantName} had accepted your invitation and proposed a new time for this event.
                        Answer and proposal are out of date.`);
                }
                if (partstat === DECLINED) {
                    if (isSingleEdit) {
                        return getSummaryParagraph(c('Calendar invite info')
                            .jt`${participantName} had declined your invitation and proposed a new time for one occurrence of this event.
                            Answer and proposal are out of date.`);
                    }
                    return getSummaryParagraph(c('Calendar invite info')
                        .jt`${participantName} had declined your invitation and proposed a new time for this event.
                        Answer and proposal are out of date.`);
                }
                if (partstat === TENTATIVE) {
                    if (isSingleEdit) {
                        return getSummaryParagraph(c('Calendar invite info')
                            .jt`${participantName} had tentatively accepted your invitation and proposed a new time for one occurrence of this event.
                            Answer and proposal are out of date.`);
                    }
                    return getSummaryParagraph(c('Calendar invite info')
                        .jt`${participantName} had tentatively accepted your invitation and proposed a new time for this event.
                        Answer and proposal are out of date.`);
                }
            }
            if (isSingleEdit) {
                return getSummaryParagraph(c('Calendar invite info')
                    .jt`${participantName} had proposed a new time for one occurrence of this event.
                    This proposal is out of date.`);
            }
            return getSummaryParagraph(
                c('Calendar invite info')
                    .jt`${participantName} had proposed a new time for this event. This proposal is out of date.`
            );
        }
        if (hasAlsoReplied) {
            if (partstat === ACCEPTED) {
                if (isSingleEdit) {
                    return getSummaryParagraph(
                        c('Calendar invite info')
                            .jt`${participantName} accepted your invitation and proposed a new time for one occurrence of this event.`
                    );
                }
                return getSummaryParagraph(
                    c('Calendar invite info')
                        .jt`${participantName} accepted your invitation and proposed a new time for this event.`
                );
            }
            if (partstat === DECLINED) {
                if (isSingleEdit) {
                    return getSummaryParagraph(
                        c('Calendar invite info')
                            .jt`${participantName} declined your invitation and proposed a new time for one occurrence of this event.`
                    );
                }
                return getSummaryParagraph(
                    c('Calendar invite info')
                        .jt`${participantName} declined your invitation and proposed a new time for this event.`
                );
            }
            if (partstat === TENTATIVE) {
                if (isSingleEdit) {
                    return getSummaryParagraph(
                        c('Calendar invite info')
                            .jt`${participantName} tentatively accepted your invitation and proposed a new time for one occurrence of this event.`
                    );
                }
                return getSummaryParagraph(
                    c('Calendar invite info')
                        .jt`${participantName} tentatively accepted your invitation and proposed a new time for this event.`
                );
            }
        }
        if (isSingleEdit) {
            return getSummaryParagraph(
                c('Calendar invite info').jt`${participantName} proposed a new time for one occurrence of this event.`
            );
        }
        return getSummaryParagraph(
            c('Calendar invite info').jt`${participantName} proposed a new time for this event.`
        );
    }

    if (method === REFRESH && attendeeIcs) {
        const { displayName: participantName } = attendeeIcs;
        if (!invitationApi) {
            if (hasNoCalendars) {
                return getSummaryParagraph(c('Calendar invite info')
                    .jt`${participantName} asked for the latest updates to an event which does not exist anymore.
                    You have no calendars.`);
            }
            return getSummaryParagraph(
                c('Calendar invite info')
                    .jt`${participantName} asked for the latest updates to an event which does not exist in your calendar anymore.`
            );
        }
        return getSummaryParagraph(
            c('Calendar invite info').jt`${participantName} asked for the latest event updates.`
        );
    }

    return null;
};

export default ExtraEventOrganizerSummary;
