import { useState } from 'react';

import { type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';
import { useFlag } from '@proton/unleash/useFlag';

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
import { useSticky } from './useSticky';
import { groupMeetingsByDay } from './utils';

export interface DashboardMeetingListProps {
    meetings: Meeting[];
    isGuest: boolean;
    handleScheduleInCalendar: () => void;
    handleScheduleClick: () => void;
    handleNewRoomClick: (room?: Meeting) => void;
    handleRotatePersonalMeeting?: () => void;
    loadingRotatePersonalMeeting?: boolean;
    newlyCreatedMeetingId?: string;
}

export const DashboardMeetingList = ({
    meetings,
    isGuest,
    handleScheduleInCalendar,
    handleScheduleClick,
    handleNewRoomClick,
    handleRotatePersonalMeeting,
    loadingRotatePersonalMeeting,
    newlyCreatedMeetingId,
}: DashboardMeetingListProps) => {
    const isPastMeetingsEnabled = useFlag('MeetPastMeetings');

    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<DashboardMeetingListTab>(DashboardMeetingListTab.TimeBased);
    const [sortBy, setSortBy] = useState<SortOption>(SortOption.Upcoming);

    const handleTabChange = (tab: DashboardMeetingListTab) => {
        setActiveTab(tab);
        setSortBy(tab === DashboardMeetingListTab.TimeBased ? SortOption.Upcoming : SortOption.NewlyCreated);
    };

    const sortOptions = getSortOptions(isPastMeetingsEnabled, activeTab);
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

    const isSearchActive = search.length > 0;

    const shouldShowSearchBar =
        // Show search bar when we are in my meetings tab and there are meetings
        (activeTab === DashboardMeetingListTab.TimeBased &&
            meetingsObject[DashboardMeetingListTab.TimeBased].length > 2) ||
        // OR when we are in my rooms tab and there are more than 1 room (counting the Personal meeting room)
        (activeTab === DashboardMeetingListTab.MeetingRooms &&
            meetingsObject[DashboardMeetingListTab.MeetingRooms].length > 1) ||
        // OR when is a search in progress because it could return no results but we still want to show the search bar
        isSearchActive;

    // Sticky header positioning
    const { isStuck, stickyRef, previousElementRef } = useSticky({ shouldUseSticky: shouldShowSearchBar });

    const meetingsByDay = groupMeetingsByDay(timeBasedMeetings, selectedSortOption?.groupBy ?? 'adjustedStartTime');

    const sortedMeetingsByDayEntries = Object.entries(meetingsByDay).sort((a, b) => {
        // Force newly-created meeting to be at the top of the list
        if (sortBy === SortOption.Upcoming && newlyCreatedMeetingId) {
            const aHasNew = a[1].some((m) => m.ID === newlyCreatedMeetingId);
            const bHasNew = b[1].some((m) => m.ID === newlyCreatedMeetingId);
            if (aHasNew) {
                return -1;
            }
            if (bHasNew) {
                return 1;
            }
        }
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
                    setActiveTab={handleTabChange}
                    timeBasedMeetingsCount={meetingsObject[DashboardMeetingListTab.TimeBased].length}
                    meetingRoomsCount={roomNumber > 0 ? roomNumber : 1}
                    ref={previousElementRef}
                    isStuck={isStuck}
                />

                {shouldShowSearchBar && (
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
                        isStuck={isStuck}
                        ref={stickyRef}
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
                        isSearchActive={isSearchActive}
                        isGuest={isGuest}
                    />
                )}

                {isGuest && <GuestUserPrompt activeTab={activeTab} />}
            </div>
        </div>
    );
};
