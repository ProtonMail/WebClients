import React from 'react';
import { classnames } from 'react-components';
import { c, msgid } from 'ttag';
import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getFrequencyString } from 'proton-shared/lib/calendar/integration/getFrequencyString';
import { dateLocale } from 'proton-shared/lib/i18n';
import { getDtendProperty } from 'proton-shared/lib/calendar/vcalConverter';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { formatDateTime, getAllDayInfo, InvitationModel } from '../../../../helpers/calendar/invite';
import { WeekStartsOn } from 'proton-shared/lib/date-fns-utc/interface';
import { RequireSome } from '../../../../models/utils';
import ExtraEventParticipants from './ExtraEventParticipants';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    defaultCalendar?: Calendar;
    weekStartsOn: WeekStartsOn;
}
const ExtraEventDetails = ({ model, defaultCalendar, weekStartsOn }: Props) => {
    const {
        isOrganizerMode,
        invitationIcs,
        invitationIcs: { method },
        invitationApi
    } = model;
    const { vevent, organizer, participants } =
        method === ICAL_METHOD.DECLINECOUNTER && invitationApi ? invitationApi : invitationIcs;
    const { rrule, dtstart } = vevent;
    const dtend = getDtendProperty(vevent);
    const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);

    const location = vevent.location?.value;
    const totalParticipants = participants?.length;
    const frequencyString = rrule
        ? getFrequencyString(rrule.value, dtstart, {
              weekStartsOn,
              locale: dateLocale
          })
        : undefined;
    const calendar = defaultCalendar?.Name;

    const properties: { label: string; value: string | React.ReactNode; key: string }[] = [
        {
            label: c('Label').t`Start time`,
            value: formatDateTime(dtstart, dateLocale, isAllDay, isSingleAllDay),
            key: 'startTime'
        },
        !isSingleAllDay && {
            label: c('Label').t`End time`,
            value: formatDateTime(dtend, dateLocale, isAllDay),
            key: 'endTime'
        },
        !!frequencyString && { label: c('Label').t`Repeats`, value: frequencyString, key: 'frequency' },
        !!calendar && { label: c('Label').t`Calendar`, value: calendar, key: 'calendar' },
        !!location && { label: c('Label').t`Location`, value: location, key: 'location' },
        !isOrganizerMode &&
            organizer && {
                label: c('Label').t`Organizer`,
                value: <ExtraEventParticipants list={[organizer]} />,
                key: 'organizer'
            },
        totalParticipants && {
            label: c('Label').ngettext(msgid`Participant`, `Participants (${totalParticipants})`, totalParticipants),
            value: <ExtraEventParticipants list={participants} />,
            key: 'participants'
        }
    ].filter(isTruthy);

    return (
        <>
            {properties.map(({ value, label, key }, index) => {
                return (
                    <div key={key} className={classnames(['flex', index < properties.length - 1 && 'mb0-5'])}>
                        <label className="mr1 w20">{label}</label>
                        <div className="flex-item-fluid">{value}</div>
                    </div>
                );
            })}
        </>
    );
};

export default ExtraEventDetails;
