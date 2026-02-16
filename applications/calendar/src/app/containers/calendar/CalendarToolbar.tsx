import type { ReactNode } from 'react';
import { useRef } from 'react';

import { Vr } from '@proton/atoms/Vr/Vr';
import TimeZoneSelector from '@proton/components/components/timezoneSelector/TimeZoneSelector';
import Toolbar from '@proton/components/components/toolbar/Toolbar';
import useElementBreakpoints from '@proton/components/hooks/useElementBreakpoints';

interface Props {
    dateCursorButtons?: ReactNode;
    viewSelector?: ReactNode;
    searchButton?: ReactNode;
    searchField?: ReactNode;
    date?: Date;
    timezone?: string;
    setTzid: (tzid: string) => void;
    hideTimeZoneSelector?: boolean;
}

const BREAKPOINTS = {
    extratiny: 200,
    tiny: 350,
    small: 550,
    medium: 700,
    large: 1100,
};

const CalendarToolbar = ({
    dateCursorButtons,
    viewSelector,
    searchButton,
    searchField,
    date,
    timezone,
    hideTimeZoneSelector = false,
    setTzid,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const responsiveTimeZoneSelector = !(breakpoint === 'extratiny' || breakpoint === 'tiny');

    return (
        <div className="w-full" ref={toolbarRef}>
            <Toolbar className="toolbar--in-container">
                {dateCursorButtons}
                {searchField}

                <span className="md:ml-auto pl-1 flex flex-nowrap justify-end">
                    {searchButton && (
                        <>
                            <Vr className="mx-1 md:hidden" />
                            {searchButton}
                            <Vr className="ml-1 hidden md:flex" />
                        </>
                    )}
                    {!hideTimeZoneSelector && responsiveTimeZoneSelector ? (
                        <div className="hidden lg:flex flex-nowrap">
                            <TimeZoneSelector
                                data-testid="calendar-view:time-zone-dropdown"
                                className="w-auto toolbar-button"
                                date={date}
                                timezone={timezone}
                                onChange={setTzid}
                                telemetrySource="temporary_timezone"
                                abbreviatedTimezone={breakpoint === 'small' ? 'offset' : undefined}
                            />
                            <Vr />
                        </div>
                    ) : undefined}
                </span>
                <span className="hidden md:flex shrink-0 lg:ml-1">{viewSelector}</span>
            </Toolbar>
        </div>
    );
};

export default CalendarToolbar;
