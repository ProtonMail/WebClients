import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcMeetCopy } from '@proton/icons';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';

export const MeetingDetails = () => {
    const { meetingLink, roomName } = useMeetContext();

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    if (!sideBarState[MeetingSideBars.MeetingDetails]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => toggleSideBarState(MeetingSideBars.MeetingDetails)}
            header={
                <div className="text-semibold flex items-center">
                    <div className="text-3xl">{c('meet_2025 Title').t`Meeting details`}</div>
                </div>
            }
        >
            <h2 className="h3 mb-4">{roomName}</h2>
            <div className="flex flex-column">
                <div className="bold mb-2">{c('meet_2025 Title').t`Joining info`}</div>
                <div className="color-weak text-sm items-center text-break-all mb-2">
                    {meetingLink}
                    <Button
                        className="mb-1 inline-block"
                        size="small"
                        shape="ghost"
                        onClick={() => navigator.clipboard.writeText(meetingLink)}
                        aria-label={c('meet_2025 Alt').t`Copy meeting link`}
                    >
                        <IcMeetCopy size={3} />
                    </Button>
                </div>
            </div>
        </SideBar>
    );
};
