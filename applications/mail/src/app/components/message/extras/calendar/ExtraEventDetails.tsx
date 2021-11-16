import { useMemo } from 'react';

import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { restrictedCalendarSanitize } from '@proton/shared/lib/calendar/sanitize';
import urlify from '@proton/shared/lib/calendar/urlify';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { IconRow } from '@proton/components';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getFrequencyString } from '@proton/shared/lib/calendar/integration/getFrequencyString';
import { dateLocale } from '@proton/shared/lib/i18n';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { getParticipantsList, InvitationModel } from '../../../../helpers/calendar/invite';
import ExtraEventParticipants from './ExtraEventParticipants';

const { REFRESH, REPLY } = ICAL_METHOD;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    weekStartsOn: WeekStartsOn;
}
const ExtraEventDetails = ({ model, weekStartsOn }: Props) => {
    const {
        isImport,
        hasMultipleVevents,
        calendarData,
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
    } = model;
    const displayApiDetails = [REFRESH, REPLY].includes(method);
    const { vevent, organizer, participants } = invitationApi && displayApiDetails ? invitationApi : invitationIcs;
    const { rrule, dtstart } = vevent;

    const trimmedLocation = vevent.location?.value?.trim();
    const sanitizedAndUrlifiedLocation = useMemo(
        () => restrictedCalendarSanitize(urlify(trimmedLocation || '')),
        [trimmedLocation]
    );
    const frequencyString = rrule
        ? getFrequencyString(rrule.value, dtstart, {
              weekStartsOn,
              locale: dateLocale,
          })
        : undefined;
    const calendar = calendarData?.calendar;
    const participantsList = getParticipantsList(participants, organizer);

    if (isImport && hasMultipleVevents) {
        return null;
    }

    return (
        <div className="p1-5">
            {!!frequencyString && (
                <IconRow icon="arrows-rotate" labelClassName="inline-flex pt0-25">
                    {frequencyString}
                </IconRow>
            )}
            {!!calendar && (
                <IconRow icon={<CalendarSelectIcon color={calendar.Color} />} labelClassName="inline-flex pt0-25">
                    {calendar.Name}
                </IconRow>
            )}
            {!!trimmedLocation && (
                <IconRow icon="map-marker" labelClassName="inline-flex pt0-25">
                    <span dangerouslySetInnerHTML={{ __html: sanitizedAndUrlifiedLocation }} />
                </IconRow>
            )}
            {!!participantsList.length && (
                <IconRow icon="user-group" labelClassName="inline-flex pt0-25">
                    <ExtraEventParticipants list={participantsList} />
                </IconRow>
            )}
        </div>
    );
};

export default ExtraEventDetails;
