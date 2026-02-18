import { c } from 'ttag';

import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { MeetingRow } from './MeetingRow';
import { PersonalMeetingRowUpsell } from './PersonalMeetingRowUpsell';
import { PlaceholderPlusSign } from './PlaceholderPlusSign';
import type { SortOptionObject } from './types';

import './RoomList.scss';

interface RoomListProps {
    meetingRooms: Meeting[];
    selectedSortOption: SortOptionObject;
    handleNewRoomClick: (room?: Meeting) => void;
    handleRotatePersonalMeeting?: () => void;
    loadingRotatePersonalMeeting?: boolean;
}

export const RoomList = ({
    meetingRooms,
    selectedSortOption,
    handleNewRoomClick,
    handleRotatePersonalMeeting,
    loadingRotatePersonalMeeting,
}: RoomListProps) => {
    return (
        <div className="room-list flex flex-column flex-nowrap gap-0 shrink-0 relative meet-glow-effect">
            {meetingRooms.length === 0 && <PersonalMeetingRowUpsell />}
            {meetingRooms.map((meeting, index) => (
                <MeetingRow
                    key={meeting.ID}
                    meeting={meeting}
                    index={index}
                    isFirst={index === 0}
                    isLast={false}
                    isRoom={true}
                    getSubtitle={selectedSortOption?.getSubtitle}
                    handleEditRoom={handleNewRoomClick}
                    handleRotatePersonalMeeting={handleRotatePersonalMeeting}
                    loadingRotatePersonalMeeting={loadingRotatePersonalMeeting}
                />
            ))}
            <button
                className="add-meeting-room-button p-6 border border-dashed flex items-center gap-6 flex-column md:flex-row cursor-pointer"
                onClick={() => handleNewRoomClick()}
            >
                <PlaceholderPlusSign />
                <div className="flex flex-column gap-1 items-center md:items-start">
                    <div className="md:text-lg color-weak">{c('Title').t`Create new room`}</div>
                    <div className="md:text-base color-hint">{c('Info')
                        .t`Set up a permanent meeting room for your team or clients`}</div>
                </div>
            </button>
        </div>
    );
};
