import { c } from 'ttag';

import { CalendarEventDateHeader } from '@proton/components';
import { ICAL_ATTENDEE_ROLE, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { getDtendProperty, propertyToLocalDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getIsPropertyAllDay } from '@proton/shared/lib/calendar/vcalHelper';
import type { RequireSome } from '@proton/shared/lib/interfaces';

import type { InvitationModel } from '../../../../helpers/calendar/invite';

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
    const startDate = propertyToLocalDate(dtstart);
    const endDate = propertyToLocalDate(dtend);
    const title = isImport && hasMultipleVevents ? invitationIcs?.fileName || '' : getDisplayTitle(summary?.value);

    const canShowOptionalHeader = method === ICAL_METHOD.REQUEST && !isOutdated && !isPartyCrasher && !isImport;
    const optionalHeader =
        canShowOptionalHeader && attendeeIcs?.role === ICAL_ATTENDEE_ROLE.OPTIONAL
            ? c('Calendar invite info').t`(Attendance optional)`
            : null;

    return (
        <div className="mb-3">
            <div className="h3 mb-1 text-bold">{title}</div>
            {!hasMultipleVevents && (
                <>
                    <CalendarEventDateHeader
                        className="text-lg"
                        startDate={startDate}
                        endDate={endDate}
                        isAllDay={isAllDay}
                        data-testid="extra-event-date-header"
                    />
                    {optionalHeader && <div className="text-sm color-weak">{optionalHeader}</div>}
                </>
            )}
        </div>
    );
};

export default ExtraEventHeader;
