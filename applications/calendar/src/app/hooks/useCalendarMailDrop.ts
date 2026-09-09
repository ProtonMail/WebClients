import { useCallback, useEffect, useRef } from 'react';

import type { DragEvent as ReactDragEvent } from 'react';

import { APPS } from '@proton/shared/lib/constants';
import { getIsDrawerPostMessage, postMessageFromIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

import { getMailDropDayStart, getMailDropStart } from '../../components/calendar/mouseHelpers/dateHelpers';

const interval = 30;

/**
 * Calendar-side counterpart to Mail's single-message drag. Tracks the generic
 * `CALENDAR_MAIL_DRAG_STATE` signal sent by Mail while an email is dragged,
 * exposes whether the day/week grid is currently a valid drop target, and, on
 * drop, computes the target slot using the grid's existing slot-position logic
 * and reports it back to Mail via `CALENDAR_MAIL_DROP`.
 */
const useCalendarMailDrop = () => {
    const mailDragActiveRef = useRef(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            if (event.data.type !== DRAWER_EVENTS.CALENDAR_MAIL_DRAG_STATE) {
                return;
            }

            const { active } = event.data.payload;
            mailDragActiveRef.current = active;
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleMailDrop = useCallback(
        (event: ReactDragEvent, { days, timeGridEl }: { days: Date[]; timeGridEl: HTMLElement }) => {
            if (!mailDragActiveRef.current) {
                return;
            }

            const gridRect = timeGridEl.getBoundingClientRect();
            const start = getMailDropStart({
                clientX: event.clientX,
                clientY: event.clientY,
                gridRect,
                days,
                interval,
            });

            if (!start) {
                return;
            }

            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.CALENDAR_MAIL_DROP,
                    payload: { start },
                },
                APPS.PROTONMAIL
            );
        },
        []
    );

    const handleMailDropOnDayGrid = useCallback(
        (event: ReactDragEvent, { rows, dayGridEl }: { rows: Date[][]; dayGridEl: HTMLElement }) => {
            if (!mailDragActiveRef.current) {
                return;
            }

            const gridRect = dayGridEl.getBoundingClientRect();
            const start = getMailDropDayStart({
                clientX: event.clientX,
                clientY: event.clientY,
                gridRect,
                rows,
            });

            if (!start) {
                return;
            }

            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.CALENDAR_MAIL_DROP,
                    payload: { start },
                },
                APPS.PROTONMAIL
            );
        },
        []
    );

    const handleMailDragOver = useCallback((event: ReactDragEvent) => {
        if (!mailDragActiveRef.current) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    return { handleMailDrop, handleMailDropOnDayGrid, handleMailDragOver };
};

export default useCalendarMailDrop;
