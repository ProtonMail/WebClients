import { RequireSome } from '../../interfaces';
import { Calendar, VcalVcalendar, VcalVeventComponent, VcalVtimezoneComponent } from '../../interfaces/calendar';
import { serialize } from '../vcal';
import { ICAL_METHOD } from '../constants';

interface CreateExportIcsParams {
    prodId: string;
    events: VcalVeventComponent[];
    vtimezones?: VcalVtimezoneComponent[];
    calendar: Calendar;
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
    events,
    vtimezones = [],
    defaultTzid,
}: CreateExportIcsParams): string => {
    const exportVcal: ExportVcal = {
        component: 'vcalendar',
        components: [...vtimezones, ...events],
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
