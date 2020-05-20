import React, { CSSProperties, Ref } from 'react';
import { classnames } from 'react-components';

import FullDayEvent from './FullDayEvent';
import PopoverHeader from './PopoverHeader';
import PopoverContent from './PopoverContent';
import { TYPE } from '../calendar/interactions/constants';
import { DAY_EVENT_HEIGHT } from '../calendar/constants';
import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    TargetEventData,
} from '../../containers/calendar/interface';
import getIsBeforeNow from '../calendar/getIsBeforeNow';

interface Props {
    isNarrow: boolean;
    date: Date;
    now: Date;
    onClose: () => void;
    formatTime: (date: Date) => string;
    style: CSSProperties;
    events: (CalendarViewEvent | CalendarViewEventTemporaryEvent)[];
    popoverRef: Ref<HTMLDivElement>;
    onClickEvent: (data: TargetEventData) => void;
    targetEventRef: Ref<HTMLDivElement>;
    targetEventData?: TargetEventData;
    tzid: string;
}
const MorePopoverEvent = ({
    isNarrow,
    date,
    now,
    onClose,
    formatTime,
    style,
    events = [],
    popoverRef,
    onClickEvent,
    targetEventRef,
    targetEventData,
    tzid,
}: Props) => {
    return (
        <div
            style={isNarrow ? undefined : style}
            className={classnames(['eventpopover p1', isNarrow && 'eventpopover--full-width'])}
            ref={popoverRef}
        >
            <PopoverHeader onClose={onClose}>
                <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut" title={`${date.getUTCDate()}`}>
                    {date.getUTCDate()}
                </h1>
            </PopoverHeader>
            <PopoverContent>
                {events.map((event) => {
                    const isSelected = targetEventData?.id === event.id;
                    const isThisSelected =
                        targetEventData &&
                        isSelected &&
                        targetEventData.idx === date.getUTCDate() &&
                        targetEventData.type === TYPE.MORE;

                    const isBeforeNow = getIsBeforeNow(event, now);

                    return (
                        <FullDayEvent
                            formatTime={formatTime}
                            event={event}
                            key={event.id}
                            className="calendar-dayeventcell w100 alignleft"
                            isSelected={isSelected}
                            tzid={tzid}
                            isBeforeNow={isBeforeNow}
                            isOutsideStart={false}
                            isOutsideEnd={false}
                            onClick={() => onClickEvent({ id: event.id, idx: date.getUTCDate(), type: TYPE.MORE })}
                            style={{
                                '--height': `${DAY_EVENT_HEIGHT}px`,
                            }}
                            eventRef={isThisSelected ? targetEventRef : undefined}
                        />
                    );
                })}
            </PopoverContent>
        </div>
    );
};

export default MorePopoverEvent;
