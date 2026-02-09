import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import { PlaceholderPlusSign } from './PlaceholderPlusSign';

import './TimeBasedMeetingsPlaceholder.scss';

interface TimeBasedMeetingsPlaceholderProps {
    handleScheduleClick: () => void;
    handleScheduleInCalendar: () => void;
    isGuest: boolean;
}

export const TimeBasedMeetingsPlaceholder = ({
    handleScheduleClick,
    handleScheduleInCalendar,
    isGuest,
}: TimeBasedMeetingsPlaceholderProps) => {
    return (
        <>
            <button
                className="placeholder-button w-full p-6 h-custom shrink-0 cursor-pointer meet-glow-effect"
                style={{ '--h-custom': '18rem' }}
                onClick={() => handleScheduleClick()}
                aria-label={c('Label').t`Schedule meeting`}
            >
                <div className="h-full w-full flex justify-center items-center">
                    <div className="flex flex-column gap-6 items-center justify-center">
                        <PlaceholderPlusSign />
                        <div className="flex flex-column items-center">
                            <div className="text-xl text-semibold color-norm">{c('Title').t`Schedule a meeting`}</div>
                            <div className="color-hint">{c('Info')
                                .t`Get a secure meeting link then add it to your calendar`}</div>
                        </div>
                        {!isGuest && (
                            <ButtonLike
                                as="span"
                                className="schedule-in-calendar-button rounded-full flex items-center justify-center gap-1 text-norm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleScheduleInCalendar();
                                }}
                                shape="ghost"
                            >
                                {c('Action').t`Schedule in ${CALENDAR_APP_NAME}`} <IcArrowOutSquare />
                            </ButtonLike>
                        )}
                    </div>
                </div>
            </button>
        </>
    );
};
