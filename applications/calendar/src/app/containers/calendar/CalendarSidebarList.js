import React from 'react';
import { Checkbox } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { getConstrastingColor } from '../../helpers/color';

const CalendarSidebarList = ({ calendars = [], loading = false, onChangeVisibility = noop }) => {
    if (calendars.length === 0) {
        return null;
    }
    return calendars.map(({ ID, Name, Display, Color }, i) => {
        return (
            <div className="navigation__link" key={ID}>
                <span data-test-id="calendar-sidebar:user-calendars" className="flex flex-nowrap flex-items-center">
                    <Checkbox
                        className="mr0-25 flex-item-noshrink"
                        color={getConstrastingColor(Color)}
                        backgroundColor={Display ? Color : 'transparent'}
                        borderColor={Color}
                        checked={!!Display}
                        disabled={loading}
                        aria-describedby={`calendar-${i}`}
                        onChange={({ target: { checked } }) => onChangeVisibility(ID, checked)}
                    />
                    <span className="ellipsis mw100" id={`calendar-${i}`} title={Name}>
                        {Name}
                    </span>
                </span>
            </div>
        );
    });
};

export default CalendarSidebarList;
