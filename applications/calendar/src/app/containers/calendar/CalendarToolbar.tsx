import React, { ReactNode } from 'react';

interface Props {
    dateCursorButtons: ReactNode;
    timezoneSelector: ReactNode;
    viewSelector: ReactNode;
}

const CalendarToolbar = ({ dateCursorButtons, timezoneSelector, viewSelector }: Props) => {
    return (
        <div className="toolbar flex flex-nowrap noprint no-scroll">
            {dateCursorButtons}
            <span className="mlauto toolbar-separator" />
            {timezoneSelector}
            <span className="toolbar-separator notablet nomobile" />
            <span className="nomobile flex flex-item-noshrink">{viewSelector}</span>
        </div>
    );
};

export default CalendarToolbar;
