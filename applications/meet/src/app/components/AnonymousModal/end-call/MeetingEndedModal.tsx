import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useMeetSelector } from '@proton/meet/store/hooks';
import type { MeetingEndedReason } from '@proton/meet/store/slices/meetAppStateSlice';
import { selectMeetingEndedReason } from '@proton/meet/store/slices/meetAppStateSlice';
import { MeetingEndedReasons } from '@proton/meet/types/types';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';

const getContent = (meetingEndedReason: MeetingEndedReason | null) => {
    if (meetingEndedReason?.reason === MeetingEndedReasons.AnotherMeetingInProgress) {
        return {
            title: c('Info').t`Meeting ended`,
            subtitle: meetingEndedReason.isLocalParticipantHost
                ? c('Info').t`You have too many meetings in progress`
                : c('Info').t`Host has another meeting in progress`,
        };
    }

    if (meetingEndedReason?.reason === MeetingEndedReasons.TimeLimitExceeded) {
        return {
            title: c('Info').t`Meeting time is up`,
            subtitle: meetingEndedReason.isLocalParticipantHost
                ? c('Info')
                      .t`This meeting reached the time limit of a free plan. Upgrade to extend your meeting length in future calls.`
                : c('Info').t`This meeting reached the time limit.`,
        };
    }
    return {
        title: c('Info').t`Meeting ended`,
        subtitle: c('Info').t`Everyone has been disconnected from the call.`,
    };
};

export const MeetingEndedModal = ({ open, onClose }: CTAModalBaseProps) => {
    const { title, subtitle } = getContent(useMeetSelector(selectMeetingEndedReason));

    return (
        <EndCallModalShell
            open={open}
            onClose={onClose}
            actions={
                <Button
                    className="create-account-low-pressure-button rounded-full px-10 py-4 text-semibold w-full"
                    onClick={() => {
                        onClose();
                    }}
                    size="medium"
                >
                    {c('Action').t`Return to dashboard`}
                </Button>
            }
            title={title}
            subtitle={subtitle}
        />
    );
};
