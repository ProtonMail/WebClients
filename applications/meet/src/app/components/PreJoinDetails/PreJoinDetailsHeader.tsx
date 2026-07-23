import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { useMeetings } from '@proton/meet/store/hooks/useMeetings';
import { selectRoomName } from '@proton/meet/store/slices/meetingInfo';
import { selectIsPersonalRoom } from '@proton/meet/store/slices/meetings';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import type { MeetState } from '@proton/meet/store/store';

type Props = {
    roomId: string;
    instantMeeting: boolean;
};

const PreJoinDetailsHeaderInternal = ({
    instantMeeting,
    isPersonalRoom = false,
    meetingsLoading = false,
}: Omit<Props, 'roomId'> & { isPersonalRoom?: boolean; meetingsLoading?: boolean }) => {
    const roomName = useMeetSelector(selectRoomName);

    const getTitle = () => {
        if (roomName) {
            return roomName;
        }
        // if the room name is not set, show the personal meeting room title base on the meeting type
        if (isPersonalRoom) {
            return c('Title').t`Personal meeting room`;
        }
        if (instantMeeting) {
            return c('Title').t`Talk confidentially`;
        }
        return c('Title').t`Join meeting`;
    };

    const getSubtitle = () => {
        if (isPersonalRoom) {
            return c('Info').t`Your always available meeting room`;
        }
        if (instantMeeting) {
            return c('Info').t`Our end-to-end encrypted meetings protect privacy and empower truly free expression.`;
        }
        return c('Info').t`You've been invited to join a secure meeting. Confirm your name and click below to enter.`;
    };

    return (
        <div className="pre-join-details-header flex flex-column gap-2 py-2 lg:py-4">
            {/* Wait for meetings to load only if not an instant meeting */}
            {(!meetingsLoading || instantMeeting) && (
                <>
                    <h1
                        className={`title text-semibold text-center hidden md:block m-0 ${isPersonalRoom ? 'color-primary' : ''}`}
                    >
                        {getTitle()}
                    </h1>
                    <div className="text-center color-weak hidden md:block">{getSubtitle()}</div>
                </>
            )}
        </div>
    );
};

const PreJoinDetailsHeaderLoggedIn = ({ roomId, ...props }: Props) => {
    const [, meetingsLoading] = useMeetings();
    const isPersonalRoom = useMeetSelector((state: MeetState) => selectIsPersonalRoom(state, roomId));

    return (
        <PreJoinDetailsHeaderInternal {...props} isPersonalRoom={isPersonalRoom} meetingsLoading={meetingsLoading} />
    );
};

export const PreJoinDetailsHeader = (props: Props) => {
    const isGuest = useMeetSelector(selectIsGuest);

    return isGuest ? (
        <PreJoinDetailsHeaderInternal instantMeeting={props.instantMeeting} />
    ) : (
        <PreJoinDetailsHeaderLoggedIn {...props} />
    );
};
