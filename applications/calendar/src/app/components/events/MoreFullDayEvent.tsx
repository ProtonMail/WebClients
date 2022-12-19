import { CSSProperties, Ref } from 'react';

import { c, msgid } from 'ttag';

import { classnames } from '@proton/components';

interface Props {
    style: CSSProperties;
    more: number;
    eventRef?: Ref<HTMLDivElement>;
    isSelected: boolean;
}
// NOTE: Can not be a button to satisfy auto close, and to be the same as the normal events
const MoreFullDayEvent = ({ style, more, eventRef, isSelected }: Props) => {
    return (
        <div
            style={style}
            className="
            calendar-dayeventcell
            h-custom
            w-custom
            top-custom
            left-custom
            absolute
        "
        >
            <div
                className={classnames([
                    'calendar-dayeventcell-inner isNotAllDay isLoaded text-ellipsis inline-flex text-left w100 pl0-5 pr0-5',
                    isSelected && 'isSelected',
                ])}
                ref={eventRef}
            >
                <span data-test-id="calendar-view:more-events-collapsed" className="myauto">
                    {
                        // translator: This string shows up when we have to collapse some events in the calendar view because they don't all fit in the window. The variable ${more} is a number. E.g.: "3 more" (short for 3 events more)
                        c('Calendar view; more events collapsed').ngettext(msgid`${more} more`, `${more} more`, more)
                    }
                </span>
            </div>
        </div>
    );
};

export default MoreFullDayEvent;
