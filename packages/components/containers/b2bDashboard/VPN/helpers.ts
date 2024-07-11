import { c } from 'ttag';

import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { ALL_EVENTS_DEFAULT } from '../Pass/helpers';
import { VPNEvent } from './interface';

enum EventTypesVPN {
    session_end = 'session_end',
    session_start = 'session_start',
    session_roaming = 'session_roaming',
}

const eventKeys = Object.keys(EventTypesVPN) as (keyof typeof EventTypesVPN)[];
export const uniqueVPNEventsArray = [ALL_EVENTS_DEFAULT, ...eventKeys];

export const getVPNEventNameText = (event: string): string => {
    switch (event) {
        case 'session_end':
            return c('Info').t`Session Ended`;
        case 'session_start':
            return c('Info').t`Session Started`;
        case 'session_roaming':
            return c('Info').t`Session Roaming`;
        default:
            return c('Info').t`All Events `;
    }
};

export const getVPNEventColor = (event: string) => {
    switch (event) {
        case 'session_end':
            return 'danger';
        case 'session_start':
            return 'success';
        case 'session_roaming':
            return 'info';
        default:
            return 'weak';
    }
};

export const downloadVPNEvents = (events: VPNEvent[]) => {
    const header = ['Time', 'User Name', 'User Email', 'Event', 'Origin IP', 'Origin Location', 'Gateway Name'];
    const csvData = events.reduce(
        (csv, { time, user, event, origin, gateway }) => {
            // const cleanedUpOriginLocation = origin.location.replace(',', '');
            const rowData = [time, user.name, user.email, event, origin.ip, origin.location, gateway.name];
            return csv + rowData.join(',') + '\n';
        },
        header.join(',') + '\n'
    );

    const blob = new Blob([csvData], { type: 'text/csv' });
    const filename = 'connectioneventlogs.csv';
    downloadFile(blob, filename);
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
