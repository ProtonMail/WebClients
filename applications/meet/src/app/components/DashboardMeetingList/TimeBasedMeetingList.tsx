import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { MeetingRow } from './MeetingRow';
import { SortOption } from './types';
import { formatMeetingDate } from './utils';

import './TimeBasedMeetingList.scss';

interface TimeBasedMeetingListProps {
    sortedMeetingsByDayEntries: [string, Meeting[]][];
    sortBy: SortOption;
    handleScheduleClick: (meeting: Meeting) => void;
}

export const TimeBasedMeetingList = ({
    sortedMeetingsByDayEntries,
    sortBy,
    handleScheduleClick,
}: TimeBasedMeetingListProps) => {
    const [userSettings] = useUserSettings();
    const dateFormat = userSettings.DateFormat;

    const getGroupWithPrefix = (date: string) => {
        const prefixes = {
            [SortOption.NewlyCreated]: c('Label').t`Created`,
            [SortOption.LastUsed]: c('Label').t`Last used`,
            [SortOption.Past]: c('Label').t`Ended`,
            [SortOption.Upcoming]: '',
        };

        return prefixes[sortBy] ? `${prefixes[sortBy]} ${date}` : date;
    };

    return (
        <div className="time-based-meeting-list flex flex-column flex-nowrap gap-4 shrink-0 relative meet-glow-effect">
            {sortedMeetingsByDayEntries.map(([date, meetings]) => {
                return (
                    <div key={date} className="w-full flex flex-column gap-4 flex-nowrap shrink-0">
                        <div className="meeting-list-day-header pl-2 flex items-center gap-3 text-uppercase">
                            <span>{getGroupWithPrefix(formatMeetingDate(date, dateFormat))}</span>
                            <div className="meeting-list-day-header-line flex-1" />
                        </div>
                        <div className="flex flex-column gap-0 flex-nowrap">
                            {meetings.map((meeting, index) => (
                                <MeetingRow
                                    key={meeting.ID}
                                    meeting={meeting}
                                    index={index}
                                    isFirst={index === 0}
                                    isLast={index === meetings.length - 1}
                                    handleEditScheduleMeeting={handleScheduleClick}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
