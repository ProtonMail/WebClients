import { format } from 'date-fns';

import downloadFile from '@proton/shared/lib/helpers/downloadFile';

export const PAGINATION_LIMIT = 50;
export const ALL_EVENTS_DEFAULT = 'All Events';

export interface EventObject {
    EventType: string;
    EventTypeName: string;
}

export const getConnectionEvents = (items: EventObject[]): EventObject[] => {
    const defaultEvent: EventObject = {
        EventType: ALL_EVENTS_DEFAULT,
        EventTypeName: ALL_EVENTS_DEFAULT,
    };
    return [defaultEvent, ...items];
};

export const getLocalTimeStringFromDate = (time: Date) => {
    // Machine-readable timestamp for the StartTime/EndTime query params, so it must stay
    // locale-independent: localizing it would change what we send to the API.
    // eslint-disable-next-line custom-rules/date-formatting-locale
    return format(time, "yyyy-MM-dd'T'HH:mm:ssxxx");
};

const isPartialIP = (input: string) => {
    const ipPartialRegex = /^(\d{1,3}\.){0,3}\d{0,3}$/;
    return ipPartialRegex.test(input);
};

const isPartialEmail = (input: string) => {
    if (input.includes('@')) {
        const [localPart, domainPart] = input.split('@');
        if (localPart && !domainPart.includes(' ')) {
            return true;
        }
    } else {
        if (!input.includes(' ')) {
            return true;
        }
    }
    return false;
};

const isEmail = (input: string) => {
    if (input.includes('@')) {
        const [localPart, domainPart] = input.split('@');
        if (localPart && !domainPart.includes(' ')) {
            return true;
        }
    }
    return false;
};

export const getSearchType = (input: string) => {
    if (!input) {
        return 'empty';
    }
    if (!isPartialIP(input) && !isEmail(input) && typeof input === 'string') {
        return 'search';
    }
    if (isPartialIP(input)) {
        return 'ip';
    }
    if (isPartialEmail(input)) {
        return 'email';
    }
    return 'invalid';
};

export const downloadPassEvents = async (response: any) => {
    const contentDisposition = response.headers.get('content-disposition');
    const match = contentDisposition.match(/attachment; filename=(.*)/);

    if (!match) {
        return null;
    }

    const blob = await response.blob();
    downloadFile(blob, match[1]);
};
