import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { AnnounceFn } from './types';
import { AnnouncementPriority } from './types';

const DEDUPE_WINDOW_MS = 3000;
const MIN_INTERVAL_MS = 800;
// Long enough to be read; cleared so stale text isn't found when navigating the region.
const MESSAGE_TTL_MS = 3000;
// Defer the write off the triggering commit. Some events (e.g. a remote recording start) update the
// region in the same tick that opens a modal and moves focus; screen readers drop an assertive update
// that lands mid-reflow/mid-utterance, so the message is only read if focus already happens to be
// stable. Writing a beat later lets that churn settle so the empty -> message transition is picked up.
const WRITE_DELAY_MS = 100;

const isCritical = (priority: number) => priority >= AnnouncementPriority.High;

interface Candidate {
    message: string;
    priority: number;
    seq: number;
    expiresAt?: number;
}

// What a channel does with a message that arrives during its cooldown. Each assertive write
// interrupts the previous one, so that channel keeps only the most urgent waiting message and drops
// the rest. Polite writes wait for each other, so that channel queues every message in arrival order
// and drops those still waiting past their expiresAt.
type PendingPolicy = 'keep-most-urgent' | 'queue-all';

interface Channel {
    regions: [string, string];
    submit: (item: Candidate) => void;
    dropNonCriticalPending: () => void;
}

// Rate-limited channel showing at most one message per MIN_INTERVAL_MS (see PendingPolicy for bursts).
// Two persistent live regions alternate as the target: updating an existing text node avoids the
// NVDA + Firefox double-read caused by node additions/removals.
const useAnnouncementChannel = (pendingPolicy: PendingPolicy): Channel => {
    const [regions, setRegions] = useState<[string, string]>(['', '']);
    const activeRegionRef = useRef<0 | 1>(0);
    const pendingRef = useRef<Candidate[]>([]);
    const displayedPriorityRef = useRef<number>(Number.NEGATIVE_INFINITY);
    const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    const show = useCallback(
        (item: Candidate) => {
            displayedPriorityRef.current = item.priority;

            // Alternate regions so repeated messages still trigger a text-node change.
            const index = activeRegionRef.current;
            activeRegionRef.current = index === 0 ? 1 : 0;

            // Reset the target region now, then write the message after a short delay (see WRITE_DELAY_MS).
            // Decoupling the write from the triggering render keeps the assertive update from being dropped
            // while the DOM is reflowing / focus is moving (e.g. the recording consent modal opening).
            setRegions((prev) => {
                if (prev[index] === '') {
                    return prev;
                }
                const next: [string, string] = [prev[0], prev[1]];
                next[index] = '';
                return next;
            });

            const write = setTimeout(() => {
                clearTimeoutsRef.current.delete(write);

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
            }, WRITE_DELAY_MS);
            clearTimeoutsRef.current.add(write);

            if (cooldownRef.current !== null) {
                clearTimeout(cooldownRef.current);
            }
            cooldownRef.current = setTimeout(() => {
                cooldownRef.current = null;
                displayedPriorityRef.current = Number.NEGATIVE_INFINITY;

                if (pendingPolicy === 'queue-all') {
                    const now = Date.now();
                    pendingRef.current = pendingRef.current.filter(
                        (item) => item.expiresAt === undefined || now <= item.expiresAt
                    );
                }

                const next = pendingRef.current.shift();
                if (next) {
                    show(next);
                }
            }, MIN_INTERVAL_MS);
        },
        [pendingPolicy]
    );

    const submit = useCallback(
        (item: Candidate) => {
            if (cooldownRef.current === null) {
                show(item);
                return;
            }

            if (pendingPolicy === 'queue-all') {
                pendingRef.current.push(item);
                return;
            }

            // More urgent than what's on screen → show immediately, interrupting it.
            if (item.priority > displayedPriorityRef.current) {
                show(item);
                return;
            }

            // Otherwise keep only the best pending candidate; ties go to the newer message.
            const [pending] = pendingRef.current;
            if (!pending || item.priority >= pending.priority) {
                pendingRef.current = [item];
            }
        },
        [show, pendingPolicy]
    );

    const dropNonCriticalPending = useCallback(() => {
        pendingRef.current = pendingRef.current.filter((item) => isCritical(item.priority));
    }, []);

    useEffect(() => {
        return () => {
            if (cooldownRef.current !== null) {
                clearTimeout(cooldownRef.current);
            }
            clearTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));

            clearTimeoutsRef.current.clear();
            pendingRef.current = [];
        };
    }, []);

    return { regions, submit, dropNonCriticalPending };
};

interface LiveAnnouncerContextValue {
    announce: AnnounceFn;
    /**
     * Drop non-critical announcements while set, including those already waiting (e.g. during
     * reconnect churn, to avoid re-announcing existing participants as fresh joins). Controlled by
     * descendants that know the connection phase, since this provider is mounted above them.
     */
    setSuspendNonCritical: (suspend: boolean) => void;
}

export const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(null);

interface LiveAnnouncerProviderProps {
    children: ReactNode;
}

/** Assertive and polite live regions with priority queue, dedupe, and stable focus. */
export const LiveAnnouncerProvider = ({ children }: LiveAnnouncerProviderProps) => {
    const {
        regions: assertiveRegions,
        submit: submitAssertive,
        dropNonCriticalPending: dropNonCriticalPendingAssertive,
    } = useAnnouncementChannel('keep-most-urgent');
    const {
        regions: politeRegions,
        submit: submitPolite,
        dropNonCriticalPending: dropNonCriticalPendingPolite,
    } = useAnnouncementChannel('queue-all');

    const recentRef = useRef<Map<string, number>>(new Map());
    const seqRef = useRef(0);

    const suspendRef = useRef(false);

    const setSuspendNonCritical = useCallback(
        (suspend: boolean) => {
            suspendRef.current = suspend;
            if (suspend) {
                dropNonCriticalPendingAssertive();
                dropNonCriticalPendingPolite();
            }
        },
        [dropNonCriticalPendingAssertive, dropNonCriticalPendingPolite]
    );

    const announce = useCallback<AnnounceFn>(
        (rawMessage, options) => {
            const trimmed = rawMessage?.trim();
            if (!trimmed) {
                return;
            }

            const priority = options?.priority ?? AnnouncementPriority.Normal;
            if (suspendRef.current && !isCritical(priority)) {
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

            const submit = options?.politeness === 'polite' ? submitPolite : submitAssertive;
            submit({
                message: trimmed,
                priority,
                seq: seqRef.current++,
                expiresAt: options?.maxWaitMs === undefined ? undefined : now + options.maxWaitMs,
            });
        },
        [submitAssertive, submitPolite]
    );

    const value = useMemo<LiveAnnouncerContextValue>(
        () => ({ announce, setSuspendNonCritical }),
        [announce, setSuspendNonCritical]
    );

    return (
        <LiveAnnouncerContext.Provider value={value}>
            {children}
            {/*
             * Portaled to body (avoids aria-hidden traps). Each channel has two persistent regions that
             * alternate as the write target so each update is a text-node change, not a node addition —
             * node additions (and role="alert" alongside aria-live) cause NVDA + Firefox to read
             * announcements twice.
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
                            {assertiveRegions[0]}
                        </div>
                        <div className="sr-only" aria-live="assertive" aria-atomic="true">
                            {assertiveRegions[1]}
                        </div>
                        <div className="sr-only" aria-live="polite" aria-atomic="true">
                            {politeRegions[0]}
                        </div>
                        <div className="sr-only" aria-live="polite" aria-atomic="true">
                            {politeRegions[1]}
                        </div>
                    </>,
                    document.body
                )}
        </LiveAnnouncerContext.Provider>
    );
};
