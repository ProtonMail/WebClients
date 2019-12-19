import React from 'react';

import FullDayEvent from './FullDayEvent';
import PopoverHeader from './PopoverHeader';
import PopoverContent from './PopoverContent';
import { TYPE } from '../calendar/interactions/constants';
import { classnames } from 'react-components';

const MorePopoverEvent = ({
    isNarrow,
    date,
    onClose,
    formatTime,
    style,
    events = [],
    popoverRef,
    onClickEvent,
    targetEventRef,
    targetEventData
}) => {
    return (
        <div
            style={isNarrow ? undefined : style}
            className={classnames(['eventpopover p1', isNarrow && 'eventpopover--full-width'])}
            ref={popoverRef}
        >
            <PopoverHeader onClose={onClose}>
                <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut" title={date.getUTCDate()}>
                    {date.getUTCDate()}
                </h1>
            </PopoverHeader>
            <PopoverContent>
                {events.map((event) => {
                    const props = {
                        onClick: () => onClickEvent({ id: event.id, idx: date.getUTCDate(), type: TYPE.MORE })
                    };
                    const isSelected = targetEventData && targetEventData.id === event.id;
                    const isThisSelected =
                        targetEventData &&
                        isSelected &&
                        targetEventData.idx === date.getUTCDate() &&
                        targetEventData.type === TYPE.MORE;

                    if (isThisSelected) {
                        props.eventRef = targetEventRef;
                    }
                    return (
                        <FullDayEvent
                            formatTime={formatTime}
                            event={event}
                            key={event.id}
                            className="calendar-dayeventcell w100 alignleft"
                            isSelected={isSelected}
                            {...props}
                        />
                    );
                })}
            </PopoverContent>
        </div>
    );
};

MorePopoverEvent.propTypes = {};

export default MorePopoverEvent;
