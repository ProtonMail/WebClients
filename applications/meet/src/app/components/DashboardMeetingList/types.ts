import type { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

export enum DashboardMeetingListTab {
    TimeBased = 'timeBased',
    MeetingRooms = 'meetingRooms',
}

export enum SortOption {
    NewlyCreated = 'newlyCreated',
    Upcoming = 'upcoming',
    Past = 'past',
    LastUsed = 'lastUsed',
}

export interface SortOptionObject {
    value: SortOption;
    label: string;
    icon: React.ReactNode;
    groupBy: 'CreateTime' | 'adjustedStartTime' | 'adjustedEndTime' | 'LastUsedTime';
    getSubtitle?: (meeting: Meeting, dateFormat: SETTINGS_DATE_FORMAT) => string;
}
