import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { IconRow, useMailSettings } from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getFrequencyString } from '@proton/shared/lib/calendar/integration/getFrequencyString';
import { restrictedCalendarSanitize } from '@proton/shared/lib/calendar/sanitize';
import urlify from '@proton/shared/lib/calendar/urlify';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { dateLocale } from '@proton/shared/lib/i18n';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';

import { InvitationModel, getParticipantsList } from '../../../../helpers/calendar/invite';
import ExtraEventParticipants from './ExtraEventParticipants';

const { REFRESH, REPLY } = ICAL_METHOD;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    weekStartsOn: WeekStartsOn;
}
const ExtraEventDetails = ({ model, weekStartsOn }: Props) => {
    const [mailSettings] = useMailSettings();
    const eventDetailsRef = useRef<HTMLDivElement>(null);

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

    const { modal: linkModal } = useLinkHandler(eventDetailsRef, mailSettings);

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
        <div className="p1-5" ref={eventDetailsRef}>
            {!!frequencyString && (
                <IconRow title={c('Label').t`Frequency`} icon="arrows-rotate" labelClassName="inline-flex pt0-25">
                    {frequencyString}
                </IconRow>
            )}
            {!!calendar && (
                <IconRow
                    title={c('Label').t`Calendar`}
                    icon={<CalendarSelectIcon color={calendar.Color} />}
                    labelClassName="inline-flex pt0-25"
                >
                    {calendar.Name}
                </IconRow>
            )}
            {!!trimmedLocation && (
                <IconRow title={c('Label').t`Location`} icon="map-pin" labelClassName="inline-flex pt0-25">
                    <span dangerouslySetInnerHTML={{ __html: sanitizedAndUrlifiedLocation }} />
                </IconRow>
            )}
            {!!participantsList.length && (
                <IconRow title={c('Label').t`Participants`} icon="users" labelClassName="inline-flex pt0-25">
                    <ExtraEventParticipants list={participantsList} />
                </IconRow>
            )}
            {linkModal}
        </div>
    );
};

export default ExtraEventDetails;
