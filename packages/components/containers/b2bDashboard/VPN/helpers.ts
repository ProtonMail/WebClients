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
        default:
            return 'color-weak';
    }
};

export const getVPNEventIcon = (event: string) => {
    switch (event) {
        case 'session_end':
            return 'lock-open-filled-2';
        case 'session_start':
            return 'lock-filled';
        case 'session_roaming':
            return 'arrows-swap-right';
        default:
            return 'lock-pen-filled';
    }
};

export const downloadEvents = async (response: Response) => {
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
