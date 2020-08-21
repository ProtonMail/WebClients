import React from 'react';
import { classnames } from 'react-components';
import { c, msgid } from 'ttag';
import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getFrequencyString } from 'proton-shared/lib/calendar/integration/getFrequencyString';
import { dateLocale } from 'proton-shared/lib/i18n';
import { getDtendProperty } from 'proton-shared/lib/calendar/vcalConverter';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Calendar, SETTINGS_WEEK_START } from 'proton-shared/lib/interfaces/calendar';
import {
    buildMailTo,
    formatDateTime,
    getAllDayInfo,
    InvitationModel,
    Participant
} from '../../../../helpers/calendar/invite';
import { RequireSome } from '../../../../models/utils';

const formatParticipant = (participant: Participant | undefined, isLast = true) => {
    if (!participant) {
        return null;
    }

    const { name, emailAddress } = participant;
    if (emailAddress) {
        if (name) {
            return (
                <>
                    <span title={name}>{`${name} `}</span>(
                    <a key={emailAddress} href={buildMailTo(emailAddress)} title={emailAddress}>
                        {emailAddress}
                    </a>
                    ){!isLast && ', '}
                </>
            );
        }
        return (
            <>
                <a key={emailAddress} href={buildMailTo(emailAddress)} title={emailAddress}>
                    {emailAddress}
                </a>
                {!isLast && ', '}
            </>
        );
    }
    return <div className="ellipsis">{name}</div>;
};

const formatParticipants = (participants: Participant[] = []) => {
    if (!participants.length) {
        return null;
    }

    return (
        <div className="break">
            {participants.map((participant, i) => {
                return formatParticipant(participant, i === participants.length - 1);
            })}
        </div>
    );
};

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    defaultCalendar?: Calendar;
}
const ExtraEventDetails = ({ model, defaultCalendar }: Props) => {
    const { method, isOrganizerMode, invitationIcs, invitationApi } = model;
    const { vevent, organizer, participants } =
        method === ICAL_METHOD.DECLINECOUNTER && invitationApi ? invitationApi : invitationIcs;
    const { rrule, dtstart } = vevent;
    const dtend = getDtendProperty(vevent);
    const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);

    const location = vevent.location?.value;
    const totalParticipants = participants?.length;
    const frequencyString = rrule
        ? getFrequencyString(rrule.value, dtstart, {
              weekStartsOn: SETTINGS_WEEK_START.MONDAY,
              locale: dateLocale
          })
        : undefined;
    const calendar = defaultCalendar?.Name;

    const properties = [
        { label: c('Label').t`Start time`, value: formatDateTime(dtstart, dateLocale, isAllDay, isSingleAllDay) },
        !isSingleAllDay && { label: c('Label').t`End time`, value: formatDateTime(dtend, dateLocale, isAllDay) },
        !!frequencyString && { label: c('Label').t`Repeats`, value: frequencyString },
        !!calendar && { label: c('Label').t`Calendar`, value: calendar },
        !!location && { label: c('Label').t`Location`, value: location },
        !isOrganizerMode && {
            label: c('Label').t`Organizer`,
            value: formatParticipant(organizer)
        },
        totalParticipants && {
            label: c('Label').ngettext(msgid`Participant`, `Participants (${totalParticipants})`, totalParticipants),
            value: formatParticipants(participants)
        }
    ].filter(isTruthy);

    return (
        <>
            {properties.map(({ value, label }, index) => {
                return (
                    <div className={classnames(['flex', index < properties.length - 1 && 'mb0-5'])} key={label}>
                        <label className="mr1 w20">{label}</label>
                        <div className="flex-item-fluid">{value}</div>
                    </div>
                );
            })}
        </>
    );
};

export default ExtraEventDetails;
