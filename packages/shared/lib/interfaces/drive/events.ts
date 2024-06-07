import { EVENT_TYPES } from '../../drive/constants';
import { LinkMeta } from './link';

export interface DriveEventsResult {
    Events: DriveEventResult[];
    EventID: string;
    More: DriveEventsPaginationFlag;
    Refresh: 0 | 1;
}

type DriveEventResult = {
    Data?: DriveEventData;
    Link: LinkMeta;
    CreateTime: number;
} & (
    | {
          EventType: EVENT_TYPES.DELETE;
      }
    | {
          EventType: EVENT_TYPES;
          ContextShareID: string;
          FromContextShareID?: string;
      }
);

type DriveEventData = {
    ExternalInvitationSignup?: string;
};

enum DriveEventsPaginationFlag {
    completed = 0,
    hasMore = 1,
}
