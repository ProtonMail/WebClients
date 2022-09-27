import { ReactNode } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

interface Props {
    dateCursorButtons: ReactNode;
    timezoneSelector: ReactNode;
    viewSelector: ReactNode;
}

const CalendarToolbar = ({ dateCursorButtons, timezoneSelector, viewSelector }: Props) => {
    return (
        <Toolbar>
            {dateCursorButtons}
            <span className="mlauto flex no-mobile">
                <Vr />
            </span>
            <span className="flex-item-fluid no-tablet no-mobile max-w24e flex flex-nowrap">{timezoneSelector}</span>
            <span className="no-tablet flex no-mobile">
                <Vr />
            </span>
            <span className="flex no-mobile flex-item-noshrink flex-gap-0-5">{viewSelector}</span>
        </Toolbar>
    );
};

export default CalendarToolbar;
