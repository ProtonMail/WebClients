import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { AnnounceFn } from './types';
import { AnnouncementPriority } from './types';

const DEDUPE_WINDOW_MS = 3000;
const MIN_INTERVAL_MS = 800;
// Long enough to be read; cleared so stale text isn't found when navigating the region.
const MESSAGE_TTL_MS = 3000;

interface Candidate {
    message: string;
    priority: number;
    seq: number;
}

interface Channel {
    regions: [string, string];
    submit: (item: Candidate) => void;
}

// Rate-limited single-pending-candidate channel (highest priority wins; bursts can't back up).
// Two persistent live regions alternate as the target: updating an existing text node avoids the
// NVDA + Firefox double-read caused by node additions/removals.
const useAnnouncementChannel = (): Channel => {
    const [regions, setRegions] = useState<[string, string]>(['', '']);
    const activeRegionRef = useRef<0 | 1>(0);
    const pendingRef = useRef<Candidate | null>(null);
    const displayedPriorityRef = useRef<number>(Number.NEGATIVE_INFINITY);
    const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    const show = useCallback((item: Candidate) => {
        displayedPriorityRef.current = item.priority;

        // Alternate regions so repeated messages still trigger a text-node change.
        const index = activeRegionRef.current;
        activeRegionRef.current = index === 0 ? 1 : 0;

        setRegions((prev) => {
            const next: [string, string] = [prev[0], prev[1]];
            next[index] = item.message;
            return next;
        });

        const clear = setTimeout(() => {
            clearTimeoutsRef.current.delete(clear);
            setRegions((prev) => {
                if (prev[index] !== item.message) {
                    return prev;
                }
                const next: [string, string] = [prev[0], prev[1]];
                next[index] = '';
                return next;
            });
        }, MESSAGE_TTL_MS);
        clearTimeoutsRef.current.add(clear);

        if (cooldownRef.current !== null) {
            clearTimeout(cooldownRef.current);
        }
        cooldownRef.current = setTimeout(() => {
            cooldownRef.current = null;
            displayedPriorityRef.current = Number.NEGATIVE_INFINITY;

            const next = pendingRef.current;
            pendingRef.current = null;
            if (next) {
                show(next);
            }
        }, MIN_INTERVAL_MS);
    }, []);

    const submit = useCallback(
        (item: Candidate) => {
            // Idle, or more urgent than what's on screen → show immediately (interrupting if needed).
            if (cooldownRef.current === null || item.priority > displayedPriorityRef.current) {
                show(item);
                return;
            }

            // Otherwise keep only the best pending candidate; ties go to the newer message.
            const pending = pendingRef.current;
            if (!pending || item.priority >= pending.priority) {
                pendingRef.current = item;
            }
        },
        [show]
    );

    useEffect(() => {
        return () => {
            if (cooldownRef.current !== null) {
                clearTimeout(cooldownRef.current);
            }
            clearTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            // eslint-disable-next-line react-hooks/exhaustive-deps
            clearTimeoutsRef.current.clear();
        };
    }, []);

    return { regions, submit };
};

export interface MeetingAnnouncerContextValue {
    announce: AnnounceFn;
}

export const MeetingAnnouncerContext = createContext<MeetingAnnouncerContextValue | null>(null);

interface MeetingAnnouncerProviderProps {
    children: ReactNode;
    /** Drop non-critical announcements during reconnect churn (avoids re-announcing existing participants as joins). */
    suspendNonCritical?: boolean;
}

/** Live region with priority queue, dedupe, and stable focus. */
export const MeetingAnnouncerProvider = ({ children, suspendNonCritical = false }: MeetingAnnouncerProviderProps) => {
    const { regions, submit } = useAnnouncementChannel();

    const recentRef = useRef<Map<string, number>>(new Map());
    const seqRef = useRef(0);

    const suspendRef = useRef(suspendNonCritical);
    suspendRef.current = suspendNonCritical;

    const announce = useCallback<AnnounceFn>(
        (rawMessage, options) => {
            const trimmed = rawMessage?.trim();
            if (!trimmed) {
                return;
            }

            const priority = options?.priority ?? AnnouncementPriority.Normal;
            if (suspendRef.current && priority < AnnouncementPriority.High) {
                return;
            }

            const now = Date.now();
            const key = options?.dedupeKey ?? trimmed;

            for (const [recentKey, timestamp] of recentRef.current) {
                if (now - timestamp >= DEDUPE_WINDOW_MS) {
                    recentRef.current.delete(recentKey);
                }
            }

            const last = recentRef.current.get(key);
            if (last !== undefined && now - last < DEDUPE_WINDOW_MS) {
                return;
            }
            recentRef.current.set(key, now);

            submit({ message: trimmed, priority, seq: seqRef.current++ });
        },
        [submit]
    );

    const value = useMemo<MeetingAnnouncerContextValue>(() => ({ announce }), [announce]);

    return (
        <MeetingAnnouncerContext.Provider value={value}>
            {children}
            {/*
             * Portaled to body (avoids aria-hidden traps). Two persistent regions alternate as the
             * write target so each update is a text-node change, not a node addition — node additions
             * (and role="alert" alongside aria-live) cause NVDA + Firefox to read announcements twice.
             */}
            {typeof document !== 'undefined' &&
                createPortal(
                    <>
                        <div
                            className="sr-only"
                            aria-live="assertive"
                            aria-atomic="true"
                            data-testid="meeting-live-region"
                        >
                            {regions[0]}
                        </div>
                        <div className="sr-only" aria-live="assertive" aria-atomic="true">
                            {regions[1]}
                        </div>
                    </>,
                    document.body
                )}
        </MeetingAnnouncerContext.Provider>
    );
};
