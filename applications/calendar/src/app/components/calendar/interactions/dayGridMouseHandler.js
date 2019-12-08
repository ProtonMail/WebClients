import { getTargetIndex } from '../mouseHelpers/mathHelpers';
import { getDiffTime, getNewTime } from '../mouseHelpers/dateHelpers';
import { blockClick, findContainingParent, findUpwards } from '../mouseHelpers/domHelpers';

const CREATE_SENSITIVITY = 20; // In pixels
const CREATE_STATE_INIT = -1;
const CREATE_STATE_ACTIVE = -2;

import { ACTIONS, TYPE } from './constants';

const createDragCreateEvent = ({
    e,
    targetRow,
    targetDate: startTargetDate,
    rows,
    eventsPerRows,
    dayGridEl,
    onMouseDown
}) => {
    let endTargetDate;
    let oldMouseX = -1;

    let result;
    let currentTargetRow;

    let callback;

    callback = onMouseDown({
        action: ACTIONS.CREATE_DOWN,
        payload: {
            type: TYPE.DAYGRID,
            idx: targetRow
        }
    });

    // Not allowed, abort
    if (!callback) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

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

        const rect = dayGridEl.getBoundingClientRect();

        currentTargetRow = getTargetIndex(e.pageY, rect.top, rect.height, eventsPerRows.length);
        const days = rows[currentTargetRow];

        const targetDay = getTargetIndex(e.pageX, rect.left, rect.width, days.length);
        const newEndTargetDate = days[targetDay];

        if (newEndTargetDate === endTargetDate) {
            return;
        }

        endTargetDate = newEndTargetDate;
        const isAfter = endTargetDate >= startTargetDate;

        if (isAfter) {
            result = {
                start: getNewTime(startTargetDate, 0),
                end: getNewTime(endTargetDate, 0)
            };
        } else {
            result = {
                start: getNewTime(endTargetDate, 0),
                end: getNewTime(startTargetDate, 0)
            };
        }

        callback({
            action: ACTIONS.CREATE_MOVE,
            payload: {
                type: TYPE.DAYGRID,
                idx: currentTargetRow,
                result
            }
        });
    };

    const handleMouseUp = (e) => {
        document.removeEventListener('mouseup', handleMouseUp, true);
        document.removeEventListener('mousemove', handleMouseMove, true);

        e.preventDefault();
        e.stopPropagation();

        if (result) {
            callback({
                action: ACTIONS.CREATE_MOVE_UP,
                payload: {
                    type: TYPE.DAYGRID,
                    idx: currentTargetRow,
                    result
                }
            });
        } else {
            // No range created, just a simple click
            result = {
                start: getNewTime(startTargetDate, 0),
                end: getNewTime(startTargetDate, 0)
            };
            callback({
                action: ACTIONS.CREATE_UP,
                payload: {
                    type: TYPE.DAYGRID,
                    idx: targetRow,
                    result
                }
            });
        }

        callback = undefined;
    };

    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    blockClick();
};

const createDragMoveEvent = ({ e, event, targetRow, targetDay, daysPerRow, eventsPerRows, dayGridEl, onMouseDown }) => {
    let oldIdx = targetRow * daysPerRow + targetDay;
    const initialIdx = oldIdx;
    let result;

    let currentTargetRow;
    let currentTargetDay;
    let currentIdx;

    const { start, end } = event;

    let callback;

    callback = onMouseDown({
        action: ACTIONS.EVENT_DOWN,
        payload: {
            type: TYPE.DAYGRID,
            idx: targetRow,
            event
        }
    });

    if (!callback) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    const handleMouseMove = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = dayGridEl.getBoundingClientRect();

        currentTargetRow = getTargetIndex(e.pageY, rect.top, rect.height, eventsPerRows.length);
        currentTargetDay = getTargetIndex(e.pageX, rect.left, rect.width, daysPerRow);
        currentIdx = currentTargetRow * daysPerRow + currentTargetDay;

        if (currentIdx === oldIdx) {
            return;
        }

        oldIdx = currentIdx;

        const differenceInDays = currentIdx - initialIdx;

        result = {
            start: getDiffTime(start, differenceInDays, 0),
            end: getDiffTime(end, differenceInDays, 0)
        };

        callback({
            action: ACTIONS.EVENT_MOVE,
            payload: {
                type: TYPE.DAYGRID,
                idx: currentTargetRow,
                result
            }
        });
    };

    const handleMouseUp = (e) => {
        document.removeEventListener('mouseup', handleMouseUp, true);
        document.removeEventListener('mousemove', handleMouseMove, true);

        e.preventDefault();
        e.stopPropagation();

        if (result) {
            callback({
                action: ACTIONS.EVENT_MOVE_UP,
                payload: {
                    type: TYPE.DAYGRID,
                    idx: currentTargetRow,
                    result
                }
            });
        } else {
            callback({
                action: ACTIONS.EVENT_UP,
                payload: {
                    type: TYPE.DAYGRID,
                    idx: targetRow,
                    event
                }
            });
        }

        callback = undefined;
    };

    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    blockClick();
};

const createUpMoreEvent = (cb) => {
    const handleMouseUp = (e) => {
        document.removeEventListener('mouseup', handleMouseUp, true);
        e.preventDefault();
        e.stopPropagation();
        cb();
    };
    document.addEventListener('mouseup', handleMouseUp, true);
    blockClick();
};

export default ({ e, onMouseDown, rows, eventsPerRows, events, dayGridEl }) => {
    const { target } = e;

    const rowElement = findUpwards(target, dayGridEl, (el) => typeof el.dataset.row !== 'undefined');
    if (!rowElement) {
        return;
    }

    const targetRow = parseInt(rowElement.dataset.row, 10);
    if (isNaN(targetRow)) {
        return;
    }
    const days = rows[targetRow];

    const rect = dayGridEl.getBoundingClientRect();
    const targetDay = getTargetIndex(e.pageX, rect.left, rect.width, days.length);
    const targetDate = days[targetDay];

    // If hitting the week container
    if ((targetRow >= 0 && target === rowElement) || target.dataset.ignoreCreate) {
        return createDragCreateEvent({
            e,
            targetRow,
            targetDate,
            rows,
            eventsPerRows,
            dayGridEl,
            onMouseDown
        });
    }

    const targetIndex = findContainingParent(rowElement, target);
    const { eventsInRowStyles, eventsInRow, eventsInRowSummary } = (eventsPerRows && eventsPerRows[targetRow]) || {};
    if (!Array.isArray(eventsInRowStyles) || targetIndex >= eventsInRowStyles.length) {
        return;
    }

    const eventStyle = eventsInRowStyles[targetIndex];
    if (!eventStyle) {
        return;
    }

    if (eventStyle.type === 'more') {
        const moreEvents = eventsInRowSummary[eventStyle.idx].events.map((i) => {
            const { idx: eventIdx } = eventsInRow[i];
            return events[eventIdx];
        });
        const callback = onMouseDown({
            action: ACTIONS.MORE_DOWN,
            payload: {
                type: TYPE.DAYGRID,
                date: targetDate,
                events: moreEvents,
                idx: eventStyle.idx,
                row: targetRow
            }
        });
        if (!callback) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        return createUpMoreEvent(() => callback({ action: ACTIONS.MORE_UP }));
    }

    const { idx: eventIdx } = eventsInRow[eventStyle.idx];
    const event = events[eventIdx];

    return createDragMoveEvent({
        e,
        event,
        targetRow,
        targetDay,
        daysPerRow: days.length,
        dayGridEl,
        eventsPerRows,
        onMouseDown
    });
};
