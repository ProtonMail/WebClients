import React, { CSSProperties, Ref } from 'react';
import { classnames } from 'react-components';

interface Props {
    style: CSSProperties;
    more: number;
    eventRef: Ref<HTMLDivElement>;
    isSelected: boolean;
}
// NOTE: Can not be a button to satisfy auto close, and to be the same as the normal events
const MoreFullDayEvent = ({ style, more, eventRef, isSelected }: Props) => {
    return (
        <div
            style={style}
            className="
            calendar-dayeventcell
            absolute
        "
        >
            <div
                className={classnames([
                    'calendar-dayeventcell-inner calendar-dayeventcell-inner--isNotAllDay calendar-dayeventcell-inner--isLoaded ellipsis inline-flex alignleft w100 pl0-5 pr0-5',
                    isSelected && 'calendar-dayeventcell-inner--isSelected',
                ])}
                ref={eventRef}
            >
                <span data-test-id="calendar-view:more-events-collapsed" className="mtauto mbauto">
                    {more} more
                </span>
            </div>
        </div>
    );
};

export default MoreFullDayEvent;
