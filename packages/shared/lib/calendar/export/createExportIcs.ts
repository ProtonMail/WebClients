import { RequireSome } from '../../interfaces';
import { VcalVcalendar, VcalVeventComponent, VcalVtimezoneComponent, VisualCalendar } from '../../interfaces/calendar';
import { ICAL_METHOD } from '../constants';
import { serialize } from '../vcal';

interface CreateExportIcsParams {
    prodId: string;
    eventsWithSummary: VcalVeventComponent[];
    vtimezones?: VcalVtimezoneComponent[];
    calendar: VisualCalendar;
    defaultTzid: string;
}

type ExportVcal = RequireSome<VcalVcalendar, 'components'> & {
    'X-WR-TIMEZONE': { value: string };
    'X-WR-CALNAME': { value: string };
    'X-WR-CALDESC'?: { value: string };
};

export const createExportIcs = ({
    calendar,
    prodId,
    eventsWithSummary,
    vtimezones = [],
    defaultTzid,
}: CreateExportIcsParams): string => {
    const exportVcal: ExportVcal = {
        component: 'vcalendar',
        components: [...vtimezones, ...eventsWithSummary],
        prodid: { value: prodId },
        version: { value: '2.0' },
        method: { value: ICAL_METHOD.PUBLISH },
        calscale: { value: 'GREGORIAN' },
        'X-WR-TIMEZONE': { value: defaultTzid },
        'X-WR-CALNAME': { value: calendar.Name },
    };

    if (calendar.Description) {
        exportVcal['X-WR-CALDESC'] = { value: calendar.Description };
    }

    return serialize(exportVcal);
};
