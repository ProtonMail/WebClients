import type { PropsWithChildren } from 'react';

import { addMinutes, isToday, startOfDay, subMinutes } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import TimeInput from '@proton/components/components/input/TimeInput';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import type { BookingRange } from '../bookingsProvider/interface';
import { roundToNextHalfHour } from '../utils/timeHelpers';

export const RangeWrapper = ({ children }: PropsWithChildren) => {
    return <div className="flex flex-nowrap gap-2 justify-space-between mb-0.5">{children}</div>;
};

export const RangeStartTimeLabel = ({ htmlFor }: { htmlFor: string }) => {
    return <label htmlFor={htmlFor} className="sr-only">{c('label').t`Start time of the booking range`}</label>;
};

export const RangeEndTimeLabel = ({ htmlFor }: { htmlFor: string }) => {
    return <label htmlFor={htmlFor} className="sr-only">{c('label').t`End time of the booking range`}</label>;
};

interface InputTimeProps {
    id: string;
    range: BookingRange;
    duration: number;
    onChange: (value: Date) => void;
    className?: string;
}

export const StartTimeInput = ({ id, range, duration, onChange, className }: InputTimeProps) => {
    return (
        <TimeInput
            id={id}
            value={range.start}
            onChange={onChange}
            min={isToday(range.start) ? roundToNextHalfHour(new Date()) : startOfDay(range.start)}
            max={subMinutes(range.end, duration)}
            className={className}
        />
    );
};

export const EndTimeInput = ({ id, range, duration, onChange, className }: InputTimeProps) => {
    return (
        <TimeInput
            id={id}
            value={range.end}
            min={addMinutes(range.start, duration)}
            onChange={onChange}
            className={className}
            preventNextDayOverflow
        />
    );
};

interface ButtonProps {
    onClick: () => void;
    btnClassName?: string;
}

export const AddButton = ({ onClick, btnClassName }: ButtonProps) => {
    return (
        <Tooltip title={c('Action').t`Add another booking range to this day`}>
            <Button icon shape="ghost" onClick={onClick} className={btnClassName}>
                <IcPlus
                    name="plus"
                    className="color-primary"
                    alt={c('Action').t`Add another booking range to this day`}
                />
            </Button>
        </Tooltip>
    );
};

export const RemoveButton = ({ onClick, btnClassName }: ButtonProps) => {
    return (
        <Tooltip title={c('Action').t`Remove the booking range`}>
            <Button icon shape="ghost" onClick={onClick} className={btnClassName}>
                <IcTrash className="color-weak" alt={c('Action').t`Remove the booking range`} />
            </Button>
        </Tooltip>
    );
};
