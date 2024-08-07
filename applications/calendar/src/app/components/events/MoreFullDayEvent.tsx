import type { CSSProperties, Ref } from 'react';

import { c, msgid } from 'ttag';

import clsx from '@proton/utils/clsx';

interface Props {
    style: CSSProperties;
    more: number;
    eventRef?: Ref<HTMLDivElement>;
    isSelected: boolean;
}
// NOTE: Can not be a button to satisfy auto close, and to be the same as the normal events
const MoreFullDayEvent = ({ style, more, eventRef, isSelected }: Props) => {
    // translator: This string shows up when we have to collapse some events in the calendar view because they don't all fit in the window. The variable ${more} is a number. E.g.: "3 more" (short for 3 events more)
    const moreText = c('Calendar view; more events collapsed').ngettext(msgid`${more} more`, `${more} more`, more);

    return (
        <div style={style} className="calendar-dayeventcell h-custom w-custom top-custom left-custom absolute">
            <div
                className={clsx([
                    'calendar-dayeventcell-inner isNotAllDay isLoaded inline-flex text-left w-full px-2',
                    isSelected && 'isSelected',
                ])}
                ref={eventRef}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
            >
                <span
                    data-testid="calendar-view:more-events-collapsed"
                    className="my-auto text-ellipsis"
                    title={moreText}
                >
                    {moreText}
                </span>
            </div>
        </div>
    );
};

export default MoreFullDayEvent;
