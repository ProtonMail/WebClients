import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcMeetCopy } from '@proton/icons';

import { SideBar } from '../atoms/SideBar/SideBar';
import { useMeetContext } from '../contexts/MeetContext';
import { MeetingSideBars } from '../types';

export const MeetingDetails = () => {
    const { meetingLink, roomName, sideBarState } = useMeetContext();

    if (!sideBarState[MeetingSideBars.MeetingDetails]) {
        return null;
    }

    return (
        <SideBar>
            <h3 className="h4 mb-8">{c('Meet').t`Meeting details`}</h3>
            <h2 className="h3 mb-4">{roomName}</h2>
            <div className="flex flex-column">
                <div className="bold mb-2">{c('Meet').t`Joining info`}</div>
                <div className="color-weak text-sm items-center text-break-all">
                    {meetingLink}
                    <Button
                        className="mb-1 inline-block"
                        size="small"
                        shape="ghost"
                        onClick={() => navigator.clipboard.writeText(meetingLink)}
                    >
                        <IcMeetCopy size={3} />
                    </Button>
                </div>
            </div>
        </SideBar>
    );
};
