import { unary } from '@proton/shared/lib/helpers/function';
import { c } from 'ttag';
import { ICAL_ATTENDEE_ROLE, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { getAllDayInfo, getDtendProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { dateLocale } from '@proton/shared/lib/i18n';
import { RequireSome } from '@proton/shared/lib/interfaces';
import { addDays, format } from 'date-fns';
import { EnDash } from 'proton-calendar/src/app/components/EnDash';
import { useMemo } from 'react';
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
    const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);
    const title = isImport && hasMultipleVevents ? invitationIcs?.fileName || '' : getDisplayTitle(summary?.value);

    const dateHeader = useMemo(() => {
        const [utcStartDate, utcEndDate] = [dtstart, dtend].map(unary(propertyToUTCDate));
        const modifiedUtcEndDate = isAllDay ? addDays(utcEndDate, -1) : utcEndDate;
        const [[dateStart, timeStart], [dateEnd, timeEnd]] = [utcStartDate, modifiedUtcEndDate].map((date) => {
            return [format(date, 'ccc, PP', { locale: dateLocale }), format(date, 'p', { locale: dateLocale })];
        });

        if (isAllDay) {
            if (isSingleAllDay) {
                return dateStart;
            }
            return (
                <>
                    {dateStart}
                    <EnDash />
                    {dateEnd}
                </>
            );
        }
        if (dateStart === dateEnd) {
            return (
                <>
                    {dateStart} | {timeStart}
                    <EnDash />
                    {timeEnd}
                </>
            );
        }
        return (
            <>
                {dateStart} {timeStart}
                <EnDash />
                {dateEnd} {timeEnd}
            </>
        );
    }, [dtstart, dtend, isAllDay, isSingleAllDay]);

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
                    <div className="text-lg mb0-25">{dateHeader}</div>
                    {optionalHeader && <div className="text-sm color-weak">{optionalHeader}</div>}
                </>
            )}
        </div>
    );
};

export default ExtraEventHeader;
