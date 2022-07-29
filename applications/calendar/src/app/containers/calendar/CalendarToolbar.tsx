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
            <span className="ml1 no-mobile flex flex-nowrap flex-item-fluid">
                <Vr className="mlauto" />
                <span className="no-tablet flex flex-nowrap">
                    <span className="flex w24e">{timezoneSelector}</span>
                    <Vr />
                </span>
                <span className="flex flex-item-noshrink">{viewSelector}</span>
            </span>
        </Toolbar>
    );
};

export default CalendarToolbar;
