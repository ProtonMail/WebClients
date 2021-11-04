import CalendarEventDateHeader from '@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader';
import { getIsPropertyAllDay } from '@proton/shared/lib/calendar/vcalHelper';
import { c } from 'ttag';
import { ICAL_ATTENDEE_ROLE, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { getDtendProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { RequireSome } from '@proton/shared/lib/interfaces';
import { addDays } from 'date-fns';
import { InvitationModel } from '../../../../helpers/calendar/invite';

const { DECLINECOUNTER, REPLY, REFRESH } = ICAL_METHOD;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventHeader = ({ model }: Props) => {
    const {
        invitationIcs,
        invitationIcs: { method, attendee: attendeeIcs },
        invitationApi,
        isOutdated,
        isPartyCrasher,
        isImport,
        hasMultipleVevents,
    } = model;

    const displayApiDetails = [REFRESH, DECLINECOUNTER, REPLY].includes(method);

    const { vevent } = invitationApi && displayApiDetails ? invitationApi : invitationIcs;
    const { dtstart, summary } = vevent;
    const dtend = getDtendProperty(vevent);
    const isAllDay = getIsPropertyAllDay(dtstart);
    const startDate = propertyToUTCDate(dtstart);
    const endDate = isAllDay ? addDays(propertyToUTCDate(dtend), -1) : propertyToUTCDate(dtend);
    const title = isImport && hasMultipleVevents ? invitationIcs?.fileName || '' : getDisplayTitle(summary?.value);

    const canShowOptionalHeader = method === ICAL_METHOD.REQUEST && !isOutdated && !isPartyCrasher && !isImport;
    const optionalHeader =
        canShowOptionalHeader && attendeeIcs?.role === ICAL_ATTENDEE_ROLE.OPTIONAL
            ? c('Calendar invite info').t`(Attendance optional)`
            : null;

    return (
        <div className="mb0-5">
            <div className="text-2xl text-ellipsis text-strong" title={title}>
                {title}
            </div>
            {!hasMultipleVevents && (
                <>
                    <CalendarEventDateHeader
                        className="text-lg mb0-25"
                        startDate={startDate}
                        endDate={endDate}
                        isAllDay={isAllDay}
                        hasAllDayUtcDates
                    />
                    {optionalHeader && <div className="text-sm color-weak">{optionalHeader}</div>}
                </>
            )}
        </div>
    );
};

export default ExtraEventHeader;
