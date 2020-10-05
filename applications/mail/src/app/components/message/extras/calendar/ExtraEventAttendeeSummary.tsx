import {
    ICAL_ATTENDEE_ROLE,
    ICAL_ATTENDEE_STATUS,
    ICAL_EVENT_STATUS,
    ICAL_METHOD
} from 'proton-shared/lib/calendar/constants';
import React from 'react';
import { c } from 'ttag';
import { getEventStatus } from 'proton-shared/lib/calendar/vcalHelper';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { InvitationModel, UPDATE_ACTION } from '../../../../helpers/calendar/invite';

const { REQUEST, CANCEL, DECLINECOUNTER } = ICAL_METHOD;
const { NEEDS_ACTION, ACCEPTED, TENTATIVE, DECLINED } = ICAL_ATTENDEE_STATUS;
const { CANCELLED } = ICAL_EVENT_STATUS;
const { REQUIRED, OPTIONAL } = ICAL_ATTENDEE_ROLE;
const { KEEP_PARTSTAT, RESET_PARTSTAT } = UPDATE_ACTION;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventAttendeeSummary = ({ model }: Props) => {
    const { invitationIcs, invitationApi, isOutdated, updateAction } = model;
    const { method, attendee: attendeeIcs } = invitationIcs;
    const { vevent: veventApi, attendee: attendeeApi } = invitationApi || {};

    if (isOutdated) {
        if (veventApi && getEventStatus(veventApi) === CANCELLED) {
            return (
                <p className="mt0 mb0-5">
                    {c('Calendar invite info').t`This invitation is out of date. The event has been cancelled.`}
                </p>
            );
        }
        return (
            <p className="mt0 mb0-5">
                {c('Calendar invite info').t`This invitation is out of date. The event has been updated.`}
            </p>
        );
    }

    if (method === DECLINECOUNTER && attendeeIcs) {
        return (
            <div>
                <p className="mt0 mb0-5">
                    {c('Calendar invite info').t`Your new time proposal has been declined by the organizer.`}
                </p>
                <p className="mt0 mb0-5">
                    {c('Calendar invite info').t`The event will take place as initially scheduled.`}
                </p>
            </div>
        );
    }
    if (method === REQUEST) {
        const hasUpdated = updateAction && [KEEP_PARTSTAT, RESET_PARTSTAT].includes(updateAction);
        const hasBeenUpdatedText = hasUpdated ? (
            <div>
                <p className="mt0 mb0">{c('Calendar invite info').t`This event has been updated.`}</p>
            </div>
        ) : null;

        const attendee = attendeeApi || attendeeIcs;
        const partstat = attendee?.partstat || NEEDS_ACTION;
        const role = attendee?.role || REQUIRED;

        if (partstat === NEEDS_ACTION) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is required.`}
                        </p>
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is optional.`}
                        </p>
                    </>
                );
            }
        }
        if (partstat === ACCEPTED) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is required.
                            You already accepted this meeting invite.`}
                        </p>
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is optional.
                        You already accepted this meeting invite.`}
                        </p>
                    </>
                );
            }
        }
        if (partstat === TENTATIVE) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is required.
                            You already tentatively accepted this meeting invite.`}
                        </p>
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is optional.
                            You already tentatively accepted this meeting invite.`}
                        </p>
                    </>
                );
            }
        }
        if (partstat === DECLINED) {
            if (role === REQUIRED) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is required.
                            You already declined this meeting invite.`}
                        </p>
                    </>
                );
            }
            if (role === OPTIONAL) {
                return (
                    <>
                        {hasBeenUpdatedText}
                        <p className="mt0 mb0-5">
                            {c('Calendar invite info').t`Your attendance to this meeting is optional.
                            You already declined this meeting invite.`}
                        </p>
                    </>
                );
            }
        }
    }
    if (method === CANCEL) {
        return <p className="mt0 mb0-5">{c('Calendar invite info').t`This event has been cancelled.`}</p>;
    }
    return null;
};

export default ExtraEventAttendeeSummary;
