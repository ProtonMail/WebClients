import { useState } from 'react';

import { type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { getNextOccurrence } from '../../utils/getNextOccurrence';
import { DashboardMeetingListTabs } from './DashboardMeetingListTabs';
import { GuestUserPrompt } from './GuestUserPrompt';
import { MeetingListHeader } from './MeetingListHeader';
import { NoResultsPlaceholder } from './NoResultsPlaceholder';
import { RoomList } from './RoomList';
import { TimeBasedMeetingList } from './TimeBasedMeetingList';
import { TimeBasedMeetingsPlaceholder } from './TimeBasedMeetingsPlaceholder';
import { getSortOptions } from './sortOptions';
import type { SortOptionObject } from './types';
import { DashboardMeetingListTab, SortOption } from './types';
import { groupMeetingsByDay } from './utils';

interface DashboardMeetingListProps {
    meetings: Meeting[];
    isGuest: boolean;
    handleScheduleInCalendar: () => void;
    handleScheduleClick: () => void;
    handleNewRoomClick: (room?: Meeting) => void;
    handleRotatePersonalMeeting?: () => void;
    loadingRotatePersonalMeeting?: boolean;
}

export const DashboardMeetingList = ({
    meetings,
    isGuest,
    handleScheduleInCalendar,
    handleScheduleClick,
    handleNewRoomClick,
    handleRotatePersonalMeeting,
    loadingRotatePersonalMeeting,
}: DashboardMeetingListProps) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<DashboardMeetingListTab>(DashboardMeetingListTab.TimeBased);
    const [sortBy, setSortBy] = useState<SortOption>(SortOption.Upcoming);

    const sortOptions = getSortOptions();
    const selectedSortOption = sortOptions.find((opt) => opt.value === sortBy) as SortOptionObject;

    const filteredMeetings = meetings.filter((meeting) =>
        meeting.MeetingName.toLowerCase().includes(search.toLowerCase())
    );

    const timeBasedMeetings = filteredMeetings
        .filter((meeting) => meeting.Type === MeetingType.SCHEDULED || meeting.Type === MeetingType.RECURRING)
        .map((meeting) => {
            const occurrence = getNextOccurrence(meeting);
            return {
                ...meeting,
                adjustedStartTime: occurrence.startTime,
                adjustedEndTime: occurrence.endTime,
            };
        });
    const meetingRooms = filteredMeetings
        .filter((meeting) => meeting.Type === MeetingType.PERMANENT || meeting.Type === MeetingType.PERSONAL)
        .sort((a, b) => {
            const aIsPersonal = a.Type === MeetingType.PERSONAL;
            const bIsPersonal = b.Type === MeetingType.PERSONAL;

            if (aIsPersonal !== bIsPersonal) {
                return aIsPersonal ? -1 : 1;
            }

            return (a.MeetingName ?? '').localeCompare(b.MeetingName ?? '');
        });

    const meetingsObject = {
        timeBased: timeBasedMeetings,
        meetingRooms: meetingRooms,
    };

    const meetingsByDay = groupMeetingsByDay(timeBasedMeetings, selectedSortOption?.groupBy ?? 'adjustedStartTime');

    const sortedMeetingsByDayEntries = Object.entries(meetingsByDay).sort((a, b) => {
        return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });

    const roomNumber = meetingsObject[DashboardMeetingListTab.MeetingRooms].length;

    return (
        <div className="dashboard-meeting-list w-full flex flex-column flex-nowrap gap-4 pb-4 shrink-0 items-center">
            <div
                className="dashboard-meeting-list-container w-full flex flex-column gap-6 md:max-w-custom"
                style={{ '--md-max-w-custom': '67.5rem' }}
            >
                <DashboardMeetingListTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    timeBasedMeetingsCount={meetingsObject[DashboardMeetingListTab.TimeBased].length}
                    meetingRoomsCount={roomNumber > 0 ? roomNumber : 1}
                />
                {/* Only show the header when there are items available OR is a search text present */}
                {((activeTab === DashboardMeetingListTab.TimeBased &&
                    meetingsObject[DashboardMeetingListTab.TimeBased].length !== 0) ||
                    (activeTab === DashboardMeetingListTab.MeetingRooms &&
                        meetingsObject[DashboardMeetingListTab.MeetingRooms].length > 1) ||
                    search.length > 0) && (
                    <MeetingListHeader
                        search={search}
                        setSearch={setSearch}
                        selectedSortOption={selectedSortOption}
                        setSortBy={(sortBy: SortOption) => setSortBy(sortBy)}
                        handleAddClick={
                            activeTab === DashboardMeetingListTab.TimeBased ? handleScheduleClick : handleNewRoomClick
                        }
                        sortOptions={sortOptions}
                        activeTab={activeTab}
                    />
                )}

                {meetingsObject[DashboardMeetingListTab.TimeBased].length === 0 &&
                    activeTab === DashboardMeetingListTab.TimeBased &&
                    (search.length > 0 ? (
                        <NoResultsPlaceholder />
                    ) : (
                        <TimeBasedMeetingsPlaceholder
                            handleScheduleClick={handleScheduleClick}
                            handleScheduleInCalendar={handleScheduleInCalendar}
                            isGuest={isGuest}
                        />
                    ))}

                {activeTab === DashboardMeetingListTab.TimeBased &&
                    meetingsObject[DashboardMeetingListTab.TimeBased].length > 0 && (
                        <TimeBasedMeetingList
                            sortedMeetingsByDayEntries={sortedMeetingsByDayEntries}
                            sortBy={sortBy}
                            handleScheduleClick={handleScheduleClick}
                        />
                    )}

                {activeTab === DashboardMeetingListTab.MeetingRooms && (
                    <RoomList
                        meetingRooms={meetingRooms}
                        selectedSortOption={selectedSortOption}
                        handleNewRoomClick={handleNewRoomClick}
                        handleRotatePersonalMeeting={handleRotatePersonalMeeting}
                        loadingRotatePersonalMeeting={loadingRotatePersonalMeeting}
                    />
                )}

                {isGuest && <GuestUserPrompt activeTab={activeTab} />}
            </div>
        </div>
    );
};
