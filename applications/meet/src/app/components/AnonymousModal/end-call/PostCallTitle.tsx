import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPreviousMeetingName } from '@proton/meet/store/slices/meetAppStateSlice';

export type PostCallTitleKind = 'left' | 'ended' | 'timeUp' | 'removed';

const titleByKind: Record<PostCallTitleKind, (meetingName: string) => string> = {
    left: (meetingName) => (meetingName ? c('Info').t`You left ${meetingName}` : c('Info').t`You left the meeting`),
    ended: (meetingName) => (meetingName ? c('Info').t`${meetingName} has ended` : c('Info').t`Meeting ended`),
    timeUp: (meetingName) =>
        meetingName ? c('Info').t`Time is up for ${meetingName}` : c('Info').t`Meeting time is up`,
    removed: (meetingName) =>
        meetingName
            ? c('Info').t`You were removed from ${meetingName}`
            : c('Info').t`You were removed from the meeting`,
};

export const PostCallTitle = ({ kind }: { kind: PostCallTitleKind }) => {
    const meetingName = useMeetSelector(selectPreviousMeetingName);

    return <span className="text-break text-ellipsis-two-lines">{titleByKind[kind](meetingName)}</span>;
};
