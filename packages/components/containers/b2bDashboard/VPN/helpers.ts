import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { ALL_EVENTS_DEFAULT } from '../Pass/helpers';

export interface Event {
    EventType: string;
    EventTypeName: string;
}

export const getConnectionEvents = (items: any[]): Event[] => {
    const defaultEvent: Event = {
        EventType: ALL_EVENTS_DEFAULT,
        EventTypeName: ALL_EVENTS_DEFAULT,
    };
    return [defaultEvent, ...items];
};

export const getVPNEventColor = (event: string) => {
    switch (event) {
        case 'session_end':
            return 'color-danger';
        case 'session_start':
            return 'color-success';
        case 'session_roaming':
            return 'color-info';
        default:
            return 'color-weak';
    }
};

export const getVPNEventIcon = (event: string) => {
    switch (event) {
        case 'session_end':
            return 'lock-filled';
        case 'session_start':
            return 'lock-filled';
        case 'session_roaming':
            return 'lock-open-pen-filled';
        default:
            return 'lock-pen-filled';
    }
};

export const downloadVPNEvents = async (response: Response) => {
    const contentDisposition = response.headers.get('content-disposition');
    if (!contentDisposition) {
        return;
    }

    const match = contentDisposition.match(/attachment; filename=(.*)/);
    if (!match) {
        return null;
    }

    const blob = await response.blob();
    downloadFile(blob, match[1]);
};

// const formatDateCSV = (date: string) => {
//     const parsedDate = parseISO(date);
//     const formattedDate = format(parsedDate, 'MMM d, yyyy, h:mm a', { locale: dateLocale });
//     return `"${formattedDate}"`;
// };

// export const formatVPNEventsCSV = async (csv: string, locale: string) => {
//     const trimmedCSV = csv.trim();
//     if (!trimmedCSV) {
//         return '';
//     }

//     const rows = trimmedCSV.split('\n');
//     const header = rows[0];

//     const formatRowAsync = async (row: string) => {
//         const columns = row.split(',');

//         try {
//             const formattedDate = formatDateCSV(columns[0]);
//             const formattedColumn5 = getLocalizedCountryByAbbr(columns[4], locale);
//             const otherColumns = [...columns.slice(1, 4), formattedColumn5, ...columns.slice(5)].map((column) =>
//                 column?.trim()
//             );

//             return [formattedDate, ...otherColumns].join(',');
//         } catch (error) {
//             console.error(`Error formatting row "${row}":`, error);
//             return row;
//         }
//     };

//     const formatStandardColumnsAsync = async (accumulatorPromise: Promise<string[]>, row: string) => {
//         const accumulator = await accumulatorPromise;
//         const formattedRow = await formatRowAsync(row);
//         return [...accumulator, formattedRow];
//     };

//     return rows
//         .slice(1)
//         .reduce(formatStandardColumnsAsync, Promise.resolve([]))
//         .then((formattedRows) => [header, ...formattedRows].join('\n'))
//         .catch((error) => {
//             console.error('Error formatting CSV:', error);
//             return csv;
//         });
// };
