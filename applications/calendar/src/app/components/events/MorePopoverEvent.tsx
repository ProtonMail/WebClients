import { CSSProperties, Ref } from 'react';
import { classnames } from '@proton/components';

import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';
import FullDayEvent from './FullDayEvent';
import PopoverHeader from './PopoverHeader';
import { TYPE } from '../calendar/interactions/constants';
import { DAY_EVENT_HEIGHT } from '../calendar/constants';
import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    TargetEventData,
} from '../../containers/calendar/interface';
import getIsBeforeNow from '../calendar/getIsBeforeNow';
import PopoverContainer from './PopoverContainer';

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
                className="calendar-dayeventcell w100 text-left"
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
    });

    return (
        <PopoverContainer
            style={isNarrow ? undefined : style}
            className={classnames([
                'eventpopover flex flex-nowrap flex-column pt2 pl1-5 pr1-5 pb2',
                isNarrow && 'eventpopover--full-width',
            ])}
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
