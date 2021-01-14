import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React from 'react';
import { classnames } from 'react-components';
import { c } from 'ttag';
import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getFrequencyString } from 'proton-shared/lib/calendar/integration/getFrequencyString';
import { dateLocale } from 'proton-shared/lib/i18n';
import { getAllDayInfo, getDtendProperty } from 'proton-shared/lib/calendar/vcalConverter';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { WeekStartsOn } from 'proton-shared/lib/date-fns-utc/interface';
import { formatEndDateTime, formatStartDateTime, InvitationModel } from '../../../../helpers/calendar/invite';
import ExtraEventParticipants from './ExtraEventParticipants';

const { REFRESH, REPLY } = ICAL_METHOD;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    weekStartsOn: WeekStartsOn;
}
const ExtraEventDetails = ({ model, weekStartsOn }: Props) => {
    const {
        isOrganizerMode,
        calendarData,
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
    } = model;
    const displayApiDetails = [REFRESH, REPLY].includes(method);
    const { vevent, organizer, participants } = invitationApi && displayApiDetails ? invitationApi : invitationIcs;
    const { rrule, dtstart } = vevent;
    const dtend = getDtendProperty(vevent);
    const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);

    const location = vevent.location?.value;
    const totalParticipants = participants?.length;
    const frequencyString = rrule
        ? getFrequencyString(rrule.value, dtstart, {
              weekStartsOn,
              locale: dateLocale,
          })
        : undefined;
    const calendar = calendarData?.calendar?.Name;

    const properties: { label: string; value: string | React.ReactNode; key: string }[] = [
        {
            label: c('Label').t`Start time`,
            value: formatStartDateTime(dtstart, dateLocale, isAllDay, isSingleAllDay),
            key: 'startTime',
        },
        !isSingleAllDay && {
            label: c('Label').t`End time`,
            value: formatEndDateTime(dtend, dateLocale, isAllDay),
            key: 'endTime',
        },
        !!frequencyString && { label: c('Label').t`Repeats`, value: frequencyString, key: 'frequency' },
        !!calendar && { label: c('Label').t`Calendar`, value: calendar, key: 'calendar' },
        !!location && { label: c('Label').t`Location`, value: location, key: 'location' },
        !isOrganizerMode &&
            organizer && {
                label: c('Label').t`Organizer`,
                value: <ExtraEventParticipants list={[organizer]} />,
                key: 'organizer',
            },
        totalParticipants && {
            label:
                totalParticipants === 1 ? c('Label').t`Participant` : c('Label').t`Participants (${totalParticipants})`,
            value: <ExtraEventParticipants list={participants} />,
            key: 'participants',
        },
    ].filter(isTruthy);

    return (
        <>
            {properties.map(({ value, label, key }, index) => {
                return (
                    <div
                        key={key}
                        className={classnames(['flex onmobile-flex-column', index < properties.length - 1 && 'mb0-5'])}
                    >
                        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                        <span className="mr1 w20 onmobile-w100 onmobile-mr0">{label}</span>
                        <div className="flex-item-fluid onmobile-pl1 hyphens">{value}</div>
                    </div>
                );
            })}
        </>
    );
};

export default ExtraEventDetails;
