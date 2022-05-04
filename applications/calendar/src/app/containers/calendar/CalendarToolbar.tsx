import { ReactNode } from 'react';
import { Toolbar } from '@proton/components';
import { Vr } from '@proton/atoms';

interface Props {
    dateCursorButtons: ReactNode;
    timezoneSelector: ReactNode;
    viewSelector: ReactNode;
}

const CalendarToolbar = ({ dateCursorButtons, timezoneSelector, viewSelector }: Props) => {
    return (
        <Toolbar>
            {dateCursorButtons}
            <Vr className="mlauto" />
            <span className="flex no-tablet no-mobile w24e">{timezoneSelector}</span>
            <Vr className="no-tablet no-mobile" />
            <span className="no-mobile flex flex-item-noshrink">{viewSelector}</span>
        </Toolbar>
    );
};

export default CalendarToolbar;
