import { ReactNode, useRef } from 'react';

import { Vr } from '@proton/atoms';
import { TimeZoneSelector, Toolbar, useElementBreakpoints } from '@proton/components';

interface Props {
    dateCursorButtons: ReactNode;
    viewSelector: ReactNode;
    date?: Date;
    telemetrySource?: string;
    timezone?: string;
    setTzid: (tzid: string) => void;
}

const BREAKPOINTS = {
    extratiny: 200,
    tiny: 350,
    small: 550,
    medium: 700,
    large: 1100,
};

const CalendarToolbar = ({ dateCursorButtons, viewSelector, date, timezone, setTzid }: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const showTimeZoneSelector = !(breakpoint === 'extratiny' || breakpoint === 'tiny');

    return (
        <div className="w100" ref={toolbarRef}>
            <Toolbar className="toolbar--in-container">
                {dateCursorButtons}
                <span className="ml-auto flex-item-fluid max-w24e flex flex-nowrap flex-justify-end no-mobile no-tablet">
                    {showTimeZoneSelector && (
                        <>
                            <TimeZoneSelector
                                data-testid="calendar-view:time-zone-dropdown"
                                className="wauto"
                                date={date}
                                timezone={timezone}
                                onChange={setTzid}
                                telemetrySource="temporary_timezone"
                                abbreviatedTimezone={breakpoint === 'small' ? 'offset' : undefined}
                            />
                            <Vr />
                        </>
                    )}
                </span>
                <span className="flex no-mobile flex-item-noshrink ml-auto lg:ml-1">{viewSelector}</span>
            </Toolbar>
        </div>
    );
};

export default CalendarToolbar;
