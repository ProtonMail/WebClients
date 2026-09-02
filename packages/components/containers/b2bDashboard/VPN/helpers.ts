import { IcArrowsSwapRight } from '@proton/icons/icons/IcArrowsSwapRight';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';
import { IcLockOpenFilled2 } from '@proton/icons/icons/IcLockOpenFilled2';
import { IcLockPenFilled } from '@proton/icons/icons/IcLockPenFilled';
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
            return IcLockOpenFilled2;
        case 'session_start':
            return IcLockFilled;
        case 'session_roaming':
            return IcArrowsSwapRight;
        default:
            return IcLockPenFilled;
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
