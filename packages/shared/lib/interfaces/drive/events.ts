import { EVENT_TYPES } from '../../drive/constants';
import { LinkMeta } from './link';

export interface DriveEventsResult {
    Events: DriveEventResult[];
    EventID: string;
    More: DriveEventsPaginationFlag;
    Refresh: 0 | 1;
}

interface DriveEventResult {
    EventType: EVENT_TYPES;
    Data: any;
    Link: LinkMeta;
    createTime: number;
}

enum DriveEventsPaginationFlag {
    completed = 0,
    hasMore = 1,
}
