import { SortSubscriptionsValue } from './interface';

export const getSortParams = (sortOption?: SortSubscriptionsValue) => {
    if (!sortOption) {
        return undefined;
    }

    switch (sortOption) {
        case SortSubscriptionsValue.LastRead:
            return 'Sort[UnreadMessageCount]=ASC';
        case SortSubscriptionsValue.MostRead:
            return 'Sort[UnreadMessageCount]=DESC';
        case SortSubscriptionsValue.Alphabetical:
            return 'Sort[Name]=ASC';
        case SortSubscriptionsValue.RecentlyReceived:
            return 'Sort[LastReceivedTime]=DESC';
        case SortSubscriptionsValue.MostFrequent:
            return 'Sort[MostFrequent]=DESC';
        case SortSubscriptionsValue.RecentlyRead:
            return 'Sort[LastReceivedTime]=DESC';
        default:
            return undefined;
    }
};
