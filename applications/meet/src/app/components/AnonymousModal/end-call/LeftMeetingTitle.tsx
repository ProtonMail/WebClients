import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPreviousMeetingName } from '@proton/meet/store/slices/meetAppStateSlice';

export const LeftMeetingTitle = () => {
    const meetingName = useMeetSelector(selectPreviousMeetingName);

    return (
        <span className="text-break text-ellipsis-two-lines">
            {meetingName ? c('Info').t`You left ${meetingName}` : c('Info').t`You left the meeting`}
        </span>
    );
};
