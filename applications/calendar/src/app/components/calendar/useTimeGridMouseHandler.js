import { addMinutes } from 'proton-shared/lib/date-fns-utc';
// eslint-disable-next-line @typescript-eslint/camelcase
import { unstable_batchedUpdates } from 'react-dom';
import { getKey } from './splitTimeGridEventsPerDay';
import { getRelativePosition, getTargetIndex } from './mouseHelpers/mathHelpers';
import { getDiffTime, getNewTime, getSnappedDate, getTargetMinutes } from './mouseHelpers/dateHelpers';
import { findContainingParent } from './mouseHelpers/domHelpers';

const DRAG_EVENT_MOVE = 1;
const DRAG_EVENT_TIME_UP = 2;
const DRAG_EVENT_TIME_DOWN = 3;

const getType = (position, offset) => {
    if (position <= offset) {
        return DRAG_EVENT_TIME_UP;
    }
    if (position >= 1 - offset) {
        return DRAG_EVENT_TIME_DOWN;
    }
    return DRAG_EVENT_MOVE;
};

const CREATE_SENSITIVITY = 25; // In pixels
const CREATE_STATE_INIT = -1;
const CREATE_STATE_ACTIVE = -2;

const useTimeGridMouseHandler = ({
    totalDays,
    totalMinutes,
    interval,
    setTemporaryEvent,
    setSelectedEventID,
    events,
    eventsPerDay,
    days
}) => {
    return (e) => {
        const dragCreateMouseDown = (daysContainer, startTargetDate, startTargetMinutes) => {
            const startDate = days[startTargetDate];
            let endTargetDate = startTargetDate;
            let endTargetMinutes;
            let oldMouseY = CREATE_STATE_INIT;

            let result;

            const handleMouseMove = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (oldMouseY === CREATE_STATE_INIT) {
                    oldMouseY = e.pageY;
                }
                if (oldMouseY !== CREATE_STATE_ACTIVE && Math.abs(oldMouseY - e.pageY) < CREATE_SENSITIVITY) {
                    return;
                }
                oldMouseY = CREATE_STATE_ACTIVE;

                const rect = daysContainer.getBoundingClientRect(); // Needed due to scrolling
                const newEndTargetDate = getTargetIndex(e.pageX, rect.left, rect.width, totalDays);
                const newEndTargetMinutes = getTargetMinutes(e.pageY, rect.top, rect.height, totalMinutes, interval);

                if (newEndTargetDate === endTargetDate && newEndTargetMinutes === endTargetMinutes) {
                    return;
                }

                // Only allow d&d on the same day
                //endTargetDate = newEndTargetDate;
                endTargetDate = startTargetDate;
                endTargetMinutes = newEndTargetMinutes;

                const isAfter =
                    endTargetDate * totalMinutes + endTargetMinutes >=
                    startTargetDate * totalMinutes + startTargetMinutes;

                const endDate = days[endTargetDate];

                if (isAfter) {
                    result = {
                        id: 'tmp',
                        start: getNewTime(startDate, startTargetMinutes),
                        end: getNewTime(endDate, endTargetMinutes + interval)
                    };
                } else {
                    result = {
                        id: 'tmp',
                        start: getNewTime(endDate, endTargetMinutes),
                        end: getNewTime(startDate, startTargetMinutes)
                    };
                }

                unstable_batchedUpdates(() => {
                    setSelectedEventID();
                    setTemporaryEvent(result);
                });
            };

            const handleMouseUp = (e) => {
                document.removeEventListener('mouseup', handleMouseUp, true);
                document.removeEventListener('mousemove', handleMouseMove, true);

                e.preventDefault();
                e.stopPropagation();

                if (result) {
                    setSelectedEventID(result.id);
                    //onDragCreate(result);
                    //setTemporaryEvents();
                    //setDateRange();
                } else {
                    // No range created, just a simple click
                    result = {
                        id: 'tmp',
                        start: getNewTime(startDate, startTargetMinutes),
                        end: getNewTime(startDate, startTargetMinutes + 30)
                    };
                    setTemporaryEvent(result);
                    setSelectedEventID(result.id);
                }
            };

            document.addEventListener('mouseup', handleMouseUp, true);
            document.addEventListener('mousemove', handleMouseMove, true);
        };

        const dragMoveEvent = (daysContainer, event, targetDate, targetMinutes, type) => {
            const { id, start, end, data, targetId } = event;
            const snappedStart = getSnappedDate(start, interval);
            const snappedEnd = getSnappedDate(end, interval);

            let oldTargetDate = targetDate;
            let oldTargetMinutes = targetMinutes;
            let result;

            const handleMouseMove = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const rect = daysContainer.getBoundingClientRect(); // Needed due to scrolling
                const currentTargetDate = getTargetIndex(e.pageX, rect.left, rect.width, totalDays);
                const currentTargetMinutes = getTargetMinutes(e.pageY, rect.top, rect.height, totalMinutes, interval);

                if (oldTargetDate === currentTargetDate && oldTargetMinutes === currentTargetMinutes) {
                    return;
                }

                oldTargetDate = currentTargetDate;
                oldTargetMinutes = currentTargetMinutes;

                // Temporary events already have a target id
                const newTargetId = id === 'tmp' ? targetId : id;

                if (type === DRAG_EVENT_MOVE) {
                    const diffDate = currentTargetDate - targetDate;
                    const diffMinutes = currentTargetMinutes - targetMinutes;

                    const newStart = getDiffTime(start, diffDate, diffMinutes);
                    const newEnd = getDiffTime(end, diffDate, diffMinutes);

                    result = {
                        id: 'tmp',
                        start: newStart,
                        end: newEnd,
                        data,
                        targetId: newTargetId
                    };

                    unstable_batchedUpdates(() => {
                        setSelectedEventID();
                        setTemporaryEvent(result);
                    });
                }

                if (type === DRAG_EVENT_TIME_UP || type === DRAG_EVENT_TIME_DOWN) {
                    // Only allow d&d on the same day
                    //const diffDate = currentTargetDate - targetDate;
                    const diffDate = 0;
                    const diffMinutes = currentTargetMinutes - targetMinutes;

                    if (type === DRAG_EVENT_TIME_UP) {
                        const diffTime = getDiffTime(snappedStart, diffDate, diffMinutes);
                        const extra = Math.abs((diffTime - end) / 60000) < interval ? interval : 0;

                        if (diffTime >= end) {
                            const diffTimeWithPadding = addMinutes(diffTime, extra);
                            result = {
                                id: 'tmp',
                                start: end,
                                end: diffTimeWithPadding,
                                data,
                                targetId: newTargetId
                            };
                        } else {
                            const diffTimeWithPadding = addMinutes(diffTime, -extra);
                            result = {
                                id: 'tmp',
                                start: diffTimeWithPadding,
                                end,
                                data,
                                targetId: newTargetId
                            };
                        }
                    } else {
                        const diffTime = getDiffTime(snappedEnd, diffDate, diffMinutes);
                        const extra = Math.abs((diffTime - start) / 60000) < interval ? interval : 0;

                        if (diffTime >= start) {
                            const diffTimeWithPadding = addMinutes(diffTime, extra);
                            result = {
                                id: 'tmp',
                                start,
                                end: diffTimeWithPadding,
                                data,
                                targetId: newTargetId
                            };
                        } else {
                            const diffTimeWithPadding = addMinutes(diffTime, -extra);
                            result = {
                                id: 'tmp',
                                start: diffTimeWithPadding,
                                end: start,
                                data,
                                targetId: newTargetId
                            };
                        }
                    }

                    unstable_batchedUpdates(() => {
                        setSelectedEventID();
                        setTemporaryEvent(result);
                    });
                }
            };

            const handleMouseUp = (e) => {
                e.preventDefault();
                e.stopPropagation();

                document.removeEventListener('mouseup', handleMouseUp, true);
                document.removeEventListener('mousemove', handleMouseMove, true);

                if (result) {
                    setSelectedEventID(result.id);
                    //onDragMove(result);
                } else {
                    setSelectedEventID(event.id);
                    //onClickEvent(event);
                }
            };

            document.addEventListener('mouseup', handleMouseUp, true);
            document.addEventListener('mousemove', handleMouseMove, true);
        };

        const { currentTarget, target } = e;

        const rect = currentTarget.getBoundingClientRect();
        const targetDate = getTargetIndex(e.pageX, rect.left, rect.width, totalDays);
        const targetMinutes = getTargetMinutes(e.pageY, rect.top, rect.height, totalMinutes, interval);

        const dayContainerNode = currentTarget.childNodes[targetDate];

        // If hitting the days container or the day container
        if (currentTarget === target || dayContainerNode === target) {
            return dragCreateMouseDown(currentTarget, targetDate, targetMinutes);
        }

        const targetIndex = findContainingParent(dayContainerNode, target);
        if (targetIndex < 0) {
            return;
        }

        const day = days[targetDate];
        if (!day) {
            return;
        }

        const eventsInDay = eventsPerDay[getKey(day)];
        // The child target index is the same as the index in the events array.
        if (!Array.isArray(eventsInDay) || targetIndex >= eventsInDay.length) {
            return;
        }
        const { idx } = eventsInDay[targetIndex];
        const event = events[idx];
        if (!event) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const eventNode = dayContainerNode.childNodes[targetIndex];
        const eventNodeRect = eventNode.getBoundingClientRect();
        const eventTargetPosition = getRelativePosition(e.pageY, eventNodeRect.top, eventNodeRect.height);

        const type = getType(eventTargetPosition, 0.2);

        if (
            (type === DRAG_EVENT_TIME_UP && event.start.getUTCDate() !== day.getUTCDate()) ||
            (type === DRAG_EVENT_TIME_DOWN && event.end.getUTCDate() !== day.getUTCDate())
        ) {
            return dragMoveEvent(currentTarget, event, targetDate, targetMinutes, DRAG_EVENT_MOVE);
        }

        return dragMoveEvent(currentTarget, event, targetDate, targetMinutes, type);
    };
};

export default useTimeGridMouseHandler;
