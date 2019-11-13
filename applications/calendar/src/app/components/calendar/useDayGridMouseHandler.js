import { getTargetIndex } from './mouseHelpers/mathHelpers';
import { getDiffTime, getNewTime } from './mouseHelpers/dateHelpers';
import { findContainingParent, findUpwards } from './mouseHelpers/domHelpers';
import { MORE_BITS } from './constants';

const CREATE_SENSITIVITY = 20; // In pixels
const CREATE_STATE_INIT = -1;
const CREATE_STATE_ACTIVE = -2;

const useDayGridMouseHandler = ({
    setTemporaryEvent,
    setSelectedEventID,
    setMoreDateIdx,
    defaultEventData,
    rows,
    eventsPerRows,
    events
}) => {
    return (e) => {
        const dragCreateMouseDown = (rowsContainer, startTargetDate) => {
            let endTargetDate;
            let oldMouseX = -1;

            let result;

            const handleMouseMove = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (oldMouseX === CREATE_STATE_INIT) {
                    oldMouseX = e.pageX;
                }
                if (oldMouseX !== CREATE_STATE_ACTIVE && Math.abs(oldMouseX - e.pageX) < CREATE_SENSITIVITY) {
                    return;
                }
                oldMouseX = CREATE_STATE_ACTIVE;

                const rect = rowsContainer.getBoundingClientRect();

                const targetRow = getTargetIndex(e.pageY, rect.top, rect.height, eventsPerRows.length);
                const days = rows[targetRow];

                const targetDay = getTargetIndex(e.pageX, rect.left, rect.width, days.length);
                const newEndTargetDate = days[targetDay];

                if (newEndTargetDate === endTargetDate) {
                    return;
                }

                endTargetDate = newEndTargetDate;
                const isAfter = endTargetDate >= startTargetDate;

                if (isAfter) {
                    result = {
                        id: 'tmp',
                        start: getNewTime(startTargetDate, 0),
                        end: getNewTime(endTargetDate, 0),
                        isAllDay: true,
                        data: defaultEventData
                    };
                } else {
                    result = {
                        id: 'tmp',
                        start: getNewTime(endTargetDate, 0),
                        end: getNewTime(startTargetDate, 0),
                        isAllDay: true,
                        data: defaultEventData
                    };
                }

                setSelectedEventID();
                setTemporaryEvent(result);
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
                        start: getNewTime(startTargetDate, 0),
                        end: getNewTime(startTargetDate, 0),
                        isAllDay: true,
                        data: defaultEventData
                    };
                    setTemporaryEvent(result);
                    setSelectedEventID(result.id);
                }
            };

            document.addEventListener('mouseup', handleMouseUp, true);
            document.addEventListener('mousemove', handleMouseMove, true);
        };

        const dragMoveEvent = (rowsContainer, event, targetRow, targetDay, daysPerRow) => {
            let oldIdx = targetRow * daysPerRow + targetDay;
            const initialIdx = oldIdx;
            let result;

            const { id, start, end, data, targetId, isAllDay, isAllPartDay } = event;

            const handleMouseMove = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const rect = rowsContainer.getBoundingClientRect();

                const newTargetRow = getTargetIndex(e.pageY, rect.top, rect.height, eventsPerRows.length);
                const newTargetDay = getTargetIndex(e.pageX, rect.left, rect.width, daysPerRow);
                const newIdx = newTargetRow * daysPerRow + newTargetDay;

                if (newIdx === oldIdx) {
                    return;
                }

                oldIdx = newIdx;

                const differenceInDays = newIdx - initialIdx;

                result = {
                    id: 'tmp',
                    start: getDiffTime(start, differenceInDays, 0),
                    end: getDiffTime(end, differenceInDays, 0),
                    data,
                    isAllDay,
                    isAllPartDay,
                    // Temporary events already have a target id
                    targetId: id === 'tmp' ? targetId : id
                };

                setSelectedEventID();
                setTemporaryEvent(result);
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

        const upMoreEvent = (rowsContainer, moreIdx) => {
            const handleMouseUp = (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.removeEventListener('mouseup', handleMouseUp, true);
                setSelectedEventID();
                setMoreDateIdx(moreIdx);
            };

            document.addEventListener('mouseup', handleMouseUp, true);
        };

        const { currentTarget, target } = e;

        const rowElement = findUpwards(target, currentTarget, (el) => typeof el.dataset.row !== 'undefined');
        if (!rowElement) {
            return;
        }

        const targetRow = parseInt(rowElement.dataset.row, 10);
        if (isNaN(targetRow)) {
            return;
        }
        const days = rows[targetRow];

        const rect = currentTarget.getBoundingClientRect();
        const targetDay = getTargetIndex(e.pageX, rect.left, rect.width, days.length);
        const targetDate = days[targetDay];

        // If hitting the week container
        if ((targetRow >= 0 && target === rowElement) || target.dataset.ignoreCreate) {
            return dragCreateMouseDown(currentTarget, targetDate);
        }

        const targetIndex = findContainingParent(rowElement, target);
        const { eventsInRowStyles, eventsInRow } = (eventsPerRows && eventsPerRows[targetRow]) || {};
        if (!Array.isArray(eventsInRowStyles) || targetIndex >= eventsInRowStyles.length) {
            return;
        }

        const eventStyle = eventsInRowStyles[targetIndex];
        if (!eventStyle) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (eventStyle.type === 'more') {
            return upMoreEvent(currentTarget, targetRow | (eventStyle.idx << MORE_BITS));
        }

        const { idx: eventIdx } = eventsInRow[eventStyle.idx];
        const event = events[eventIdx];
        return dragMoveEvent(currentTarget, event, targetRow, targetDay, days.length);
    };
};

export default useDayGridMouseHandler;
