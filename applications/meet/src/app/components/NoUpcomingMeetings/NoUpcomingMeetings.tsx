import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import useFlag from '@proton/unleash/useFlag';

import './NoUpcomingMeetings.scss';

interface NoUpcomingMeetingsProps {
    onSchedule: () => void;
    onStart: () => void;
}

export const NoUpcomingMeetings = ({ onSchedule, onStart }: NoUpcomingMeetingsProps) => {
    const isScheduleEnabled = useFlag('NewScheduleOption');

    return (
        <div
            className="w-custom mx-auto flex flex-column items-center justify-center gap-4"
            style={{ '--w-custom': '21.4375rem' }}
        >
            <MeetLogo
                variant="glyph-only"
                className="w-custom h-custom"
                style={{ '--w-custom': '3rem', '--h-custom': '3rem' }}
            />
            <div className="color-norm text-center text-3xl text-semibold">
                {c('Info')
                    .t`Every call, screen share, and chat is end-to-end encrypted to protect your most important connections.`}
            </div>
            <div className="flex w-full justify-center gap-2">
                <Button
                    className="no-upcoming-meetings-schedule-button rounded-full w-custom border-none"
                    style={{ '--w-custom': '8.6525rem' }}
                    size="large"
                    onClick={onSchedule}
                    disabled={!isScheduleEnabled}
                >
                    {c('Action').t`Schedule`}
                </Button>
                <Button
                    className="no-upcoming-meetings-start-button rounded-full w-custom border-none"
                    style={{ '--w-custom': '8.6525rem' }}
                    size="large"
                    onClick={onStart}
                >
                    {c('Action').t`Start`}
                </Button>
            </div>
        </div>
    );
};
