import { CSSProperties, Ref } from 'react';

import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';

import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    TargetEventData,
} from '../../containers/calendar/interface';
import { DAY_EVENT_HEIGHT } from '../calendar/constants';
import getIsBeforeNow from '../calendar/getIsBeforeNow';
import { TYPE } from '../calendar/interactions/constants';
import FullDayEvent from './FullDayEvent';
import PopoverContainer from './PopoverContainer';
import PopoverHeader from './PopoverHeader';

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
    const dateString = formatUTC(date, 'cccc PPP', { locale: dateLocale });

    const eventsContent = events.map((event) => {
        const isSelected = targetEventData?.uniqueId === event.uniqueId;
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
                key={event.uniqueId}
                className="calendar-dayeventcell w-full text-left h-custom"
                isSelected={isSelected}
                tzid={tzid}
                isBeforeNow={isBeforeNow}
                isOutsideStart={false}
                isOutsideEnd={false}
                onClick={() => onClickEvent({ uniqueId: event.uniqueId, idx: date.getUTCDate(), type: TYPE.MORE })}
                style={{
                    '--h-custom': `${DAY_EVENT_HEIGHT}px`,
                }}
                eventRef={isThisSelected ? targetEventRef : undefined}
            />
        );
    });

    return (
        <PopoverContainer
            style={isNarrow ? undefined : style}
            className="eventpopover flex flex-nowrap flex-column py-7 px-5"
            ref={popoverRef}
        >
            <PopoverHeader onClose={onClose} className="flex-item-noshrink">
                <h1
                    className="eventpopover-title lh-rg text-ellipsis-four-lines text-cut"
                    title={`${date.getUTCDate()}`}
                >
                    {dateString}
                </h1>
            </PopoverHeader>
            <div className="scroll-if-needed">{eventsContent}</div>
        </PopoverContainer>
    );
};

export default MorePopoverEvent;
