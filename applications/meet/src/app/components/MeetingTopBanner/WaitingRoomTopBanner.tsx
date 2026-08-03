import { c, msgid } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { openWaitingRoomSideBar } from '@proton/meet/store/slices/uiStateSlice';

export const WaitingRoomTopBanner = ({ waitingRoomParticipantsCount }: { waitingRoomParticipantsCount: number }) => {
    const dispatch = useMeetDispatch();

    return (
        <div className="flex flex-nowrap gap-2 items-center justify-center">
            <span>
                {c('Info').ngettext(
                    msgid`${waitingRoomParticipantsCount} person is waiting`,
                    `${waitingRoomParticipantsCount} people are waiting`,
                    waitingRoomParticipantsCount
                )}
            </span>
            <InlineLinkButton
                onClick={() => {
                    dispatch(openWaitingRoomSideBar());
                }}
            >
                View
            </InlineLinkButton>
        </div>
    );
};
