import {
    ICAL_ATTENDEE_ROLE,
    ICAL_ATTENDEE_STATUS,
    ICAL_EVENT_STATUS,
    ICAL_METHOD,
} from 'proton-shared/lib/calendar/constants';
import React from 'react';
import { c } from 'ttag';
import { getEventStatus } from 'proton-shared/lib/calendar/vcalHelper';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import { InvitationModel, UPDATE_ACTION } from '../../../../helpers/calendar/invite';
import { getSummaryParagraph } from './ExtraEventSummary';

const { REQUEST, CANCEL, ADD } = ICAL_METHOD;
const { NEEDS_ACTION, ACCEPTED, TENTATIVE, DECLINED } = ICAL_ATTENDEE_STATUS;
const { CANCELLED } = ICAL_EVENT_STATUS;
const { REQUIRED, OPTIONAL } = ICAL_ATTENDEE_ROLE;
const { KEEP_PARTSTAT, RESET_PARTSTAT } = UPDATE_ACTION;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventAttendeeSummary = ({ model }: Props) => {
    const { invitationIcs, invitationApi, isOutdated, updateAction } = model;
    const { method, attendee: attendeeIcs, vevent: veventIcs } = invitationIcs;
    const { vevent: veventApi, attendee: attendeeApi } = invitationApi || {};
    const veventIcsTitle = getDisplayTitle(veventIcs.summary?.value);

    if (method === REQUEST) {
        if (isOutdated) {
            if (veventApi && getEventStatus(veventApi) === CANCELLED) {
                return getSummaryParagraph(
                    c('Calendar invite info').t`This invitation is out of date. The event has been cancelled.`
                );
            }
            return getSummaryParagraph(
                c('Calendar invite info').t`This invitation is out of date. The event has been updated.`
            );
        }
        const hasUpdated = updateAction && [KEEP_PARTSTAT, RESET_PARTSTAT].includes(updateAction);
        const hasBeenUpdatedText = hasUpdated
            ? getSummaryParagraph(c('Calendar invite info').t`This event has been updated.`)
            : null;

        const attendee = attendeeApi || attendeeIcs;
        const partstat = attendee?.partstat || NEEDS_ACTION;
        const role = attendee?.role || REQUIRED;

        if (partstat === NEEDS_ACTION) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(c('Calendar invite info').t`Your attendance to this meeting is required.`)}
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(c('Calendar invite info').t`Your attendance to this meeting is optional.`)}
                    </>
                );
            }
        }
        if (partstat === ACCEPTED) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(
                            c('Calendar invite info')
                                .t`Your attendance to this meeting is required. You already accepted this meeting invite.`
                        )}
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(c('Calendar invite info').t`Your attendance to this meeting is optional.
                            You already accepted this meeting invite.`)}
                    </>
                );
            }
        }
        if (partstat === TENTATIVE) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(c('Calendar invite info').t`Your attendance to this meeting is required.
                            You already tentatively accepted this meeting invite.`)}
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(c('Calendar invite info').t`Your attendance to this meeting is optional.
                            You already tentatively accepted this meeting invite.`)}
                    </>
                );
            }
        }
        if (partstat === DECLINED) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(c('Calendar invite info').t`Your attendance to this meeting is required.
                            You already declined this meeting invite.`)}
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        {getSummaryParagraph(c('Calendar invite info').t`Your attendance to this meeting is optional.
                            You already declined this meeting invite.`)}
                    </>
                );
            }
        }
    }

    if (method === CANCEL) {
        return <p className="mt0 mb0-5">{c('Calendar invite info').t`This event has been cancelled.`}</p>;
    }

    if (method === ADD) {
        if (!veventApi) {
            return getSummaryParagraph(
                c('Calendar invite info').t`This invitation is out of date. The event has been deleted.`
            );
        }
        if (isOutdated) {
            if (getEventStatus(veventApi) === CANCELLED) {
                return getSummaryParagraph(
                    c('Calendar invite info').t`This invitation is out of date. The event has been cancelled.`
                );
            }
            return getSummaryParagraph(
                c('Calendar invite info').t`This invitation is out of date. The event has been updated.`
            );
        }
        return getSummaryParagraph(
            c('Calendar invite info').t`An occurrence has been added to the event ${veventIcsTitle}`
        );
    }

    return null;
};

export default ExtraEventAttendeeSummary;
