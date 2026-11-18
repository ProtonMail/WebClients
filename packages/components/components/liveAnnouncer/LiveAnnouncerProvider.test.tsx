import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { LiveAnnouncerProvider } from './LiveAnnouncerProvider';
import { AnnouncementPriority } from './types';
import { useAnnounce, useSetSuspendNonCritical } from './useAnnounce';

const wrapper = ({ children }: { children: ReactNode }) => <LiveAnnouncerProvider>{children}</LiveAnnouncerProvider>;

const renderAnnouncer = () =>
    renderHook(() => ({ announce: useAnnounce(), setSuspendNonCritical: useSetSuspendNonCritical() }), { wrapper });

const regionTexts = (politeness: 'assertive' | 'polite' = 'assertive') =>
    Array.from(document.body.querySelectorAll(`[aria-live="${politeness}"]`)).map((region) => region.textContent);

const advance = (ms: number) =>
    act(() => {
        vi.advanceTimersByTime(ms);
    });

describe('LiveAnnouncerProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('writes the message to a live region after a short delay, then clears it', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('  Alice joined  '));
        expect(regionTexts()).toEqual(['', '']);

        advance(100);
        expect(regionTexts()).toEqual(['Alice joined', '']);

        advance(3000);
        expect(regionTexts()).toEqual(['', '']);
    });

    it('drops the same message within the dedupe window', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('Alice joined'));
        advance(1000);
        act(() => result.current.announce('Alice joined'));
        advance(100);

        expect(regionTexts()).toEqual(['Alice joined', '']);
    });

    it('alternates regions so a repeated message after the dedupe window is a new text change', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('Alice joined'));
        advance(3100);
        act(() => result.current.announce('Alice joined'));
        advance(100);

        expect(regionTexts()).toEqual(['', 'Alice joined']);
    });

    it('keeps the highest priority message pending during the cooldown', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('First'));
        act(() => result.current.announce('Second'));
        act(() => result.current.announce('Third'));
        advance(100);
        expect(regionTexts()).toEqual(['First', '']);

        advance(800);
        expect(regionTexts()).toEqual(['First', 'Third']);
    });

    it('interrupts the cooldown for a more urgent message', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('Alice joined'));
        act(() => result.current.announce('Connection lost', { priority: AnnouncementPriority.High }));
        advance(100);

        expect(regionTexts()).toEqual(['Alice joined', 'Connection lost']);
    });

    it('drops only non-critical messages while suspended', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.setSuspendNonCritical(true));
        act(() => result.current.announce('Alice joined'));
        advance(1000);
        expect(regionTexts()).toEqual(['', '']);

        act(() => result.current.announce('Connection lost', { priority: AnnouncementPriority.High }));
        advance(100);
        expect(regionTexts()).toEqual(['Connection lost', '']);
    });

    it('writes a polite message to a polite region only', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('Alice joined', { politeness: 'polite' }));
        advance(100);

        expect(regionTexts('polite')).toEqual(['Alice joined', '']);
        expect(regionTexts('assertive')).toEqual(['', '']);
    });

    it('writes an assertive message, and a message with no politeness, to an assertive region only', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('Connection lost', { politeness: 'assertive' }));
        advance(900);
        act(() => result.current.announce('Recording started'));
        advance(100);

        expect(regionTexts('assertive')).toEqual(['Connection lost', 'Recording started']);
        expect(regionTexts('polite')).toEqual(['', '']);
    });

    it('delivers a polite and an assertive message made back to back', () => {
        const { result } = renderAnnouncer();

        act(() => result.current.announce('Alice joined', { politeness: 'polite' }));
        act(() => result.current.announce('Recording started'));
        advance(100);

        expect(regionTexts('polite')).toEqual(['Alice joined', '']);
        expect(regionTexts('assertive')).toEqual(['Recording started', '']);
    });

    it('delivers every polite message of a burst, in arrival order, one per interval', () => {
        const { result } = renderAnnouncer();

        act(() => {
            result.current.announce('Bob mentioned you', { politeness: 'polite' });
            result.current.announce('Carol mentioned you', { politeness: 'polite' });
            result.current.announce('Dave mentioned you', { politeness: 'polite' });
        });
        advance(100);
        expect(regionTexts('polite')).toEqual(['Bob mentioned you', '']);

        advance(800);
        expect(regionTexts('polite')).toEqual(['Bob mentioned you', 'Carol mentioned you']);

        advance(800);
        expect(regionTexts('polite')).toEqual(['Dave mentioned you', 'Carol mentioned you']);
    });

    describe('polite queue wait limit', () => {
        const intervalMs = 800;
        const writeDelayMs = 100;
        const joins = Array.from({ length: 15 }, (_, index) => `Participant ${index + 1} joined`);

        const recordPoliteWrites = () => {
            const writes: [string, number][] = [];
            let previousTexts = regionTexts('polite');
            let elapsedMs = 0;
            const recordUntil = (untilMs: number) => {
                while (elapsedMs < untilMs) {
                    advance(writeDelayMs);
                    elapsedMs += writeDelayMs;
                    const texts = regionTexts('polite');
                    for (const [index, text] of texts.entries()) {
                        if (text && text !== previousTexts[index]) {
                            writes.push([text, elapsedMs]);
                        }
                    }
                    previousTexts = texts;
                }
            };
            return { writes, recordUntil };
        };

        // Join n reaches the front at (n - 1) × interval, so joins that are still within their wait limit are read.
        const freshJoinWrites = (maxWaitMs: number) =>
            joins
                .slice(0, Math.floor(maxWaitMs / intervalMs) + 1)
                .map((message, index): [string, number] => [message, index * intervalMs + writeDelayMs]);

        it('drops queued messages still waiting after their maxWaitMs, so a later message is not stuck behind them', () => {
            const maxWaitMs = 8000;
            const mentionSubmittedAtMs = 1000;
            const { result } = renderAnnouncer();
            const { writes, recordUntil } = recordPoliteWrites();

            act(() =>
                joins.forEach((message) => result.current.announce(message, { politeness: 'polite', maxWaitMs }))
            );
            recordUntil(mentionSubmittedAtMs);
            act(() => result.current.announce('Zoe mentioned you', { politeness: 'polite' }));
            recordUntil(joins.length * intervalMs + 2 * intervalMs);

            const freshWrites = freshJoinWrites(maxWaitMs);
            const mentionWrittenAtMs = freshWrites.length * intervalMs + writeDelayMs;
            expect(writes).toEqual([...freshWrites, ['Zoe mentioned you', mentionWrittenAtMs]]);
            expect(mentionWrittenAtMs - mentionSubmittedAtMs).toBeLessThanOrEqual(maxWaitMs);
        });

        it('reads a mention with a longer wait limit once, after a burst of joins whose wait limit passed', () => {
            const joinMaxWaitMs = 8000;
            const { result } = renderAnnouncer();
            const { writes, recordUntil } = recordPoliteWrites();

            act(() => {
                joins.forEach((message) =>
                    result.current.announce(message, { politeness: 'polite', maxWaitMs: joinMaxWaitMs })
                );
                result.current.announce('Zoe mentioned you', { politeness: 'polite', maxWaitMs: 30000 });
            });
            recordUntil(2 * joins.length * intervalMs);

            const freshWrites = freshJoinWrites(joinMaxWaitMs);
            expect(writes).toEqual([
                ...freshWrites,
                ['Zoe mentioned you', freshWrites.length * intervalMs + writeDelayMs],
            ]);
        });

        it('never drops a message without maxWaitMs, however long it waited', () => {
            const { result } = renderAnnouncer();
            const { writes, recordUntil } = recordPoliteWrites();

            act(() => joins.forEach((message) => result.current.announce(message, { politeness: 'polite' })));
            recordUntil(joins.length * intervalMs + 2 * intervalMs);

            expect(writes).toEqual(joins.map((message, index) => [message, index * intervalMs + writeDelayMs]));
        });
    });

    describe('polite channel transitions', () => {
        type Announcer = ReturnType<typeof renderAnnouncer>['result']['current'];

        const states: Record<string, (announcer: Announcer) => void> = {
            idle: () => {},
            'cooling down, empty queue': (announcer) => {
                announcer.announce('Alice joined', { politeness: 'polite' });
            },
            'cooling down, queued messages': (announcer) => {
                announcer.announce('Alice left', { politeness: 'polite' });
                announcer.announce('Bob left', { politeness: 'polite' });
                announcer.announce('Carol left', { politeness: 'polite' });
            },
        };

        const events: Record<string, (announcer: Announcer) => void> = {
            'polite announce': (announcer) => {
                announcer.announce('Dave joined', { politeness: 'polite' });
            },
            'cooldown end': () => {
                vi.advanceTimersByTime(800);
            },
            'suspend on': (announcer) => {
                announcer.setSuspendNonCritical(true);
            },
            'suspend off': (announcer) => {
                announcer.setSuspendNonCritical(false);
            },
            'high priority announce while suspended': (announcer) => {
                announcer.setSuspendNonCritical(true);
                announcer.announce('Connection lost', { priority: AnnouncementPriority.High });
            },
        };

        const writesWhileDraining = () => {
            const writes: Record<'polite' | 'assertive', string[]> = { polite: [], assertive: [] };
            for (let elapsed = 0; elapsed < 3000; elapsed += 100) {
                advance(100);
                (['polite', 'assertive'] as const).forEach((politeness) => {
                    regionTexts(politeness).forEach((text) => {
                        if (text && !writes[politeness].includes(text)) {
                            writes[politeness].push(text);
                        }
                    });
                });
            }
            return writes;
        };

        it.each([
            { state: 'idle', event: 'polite announce', polite: ['Dave joined'], assertive: [] },
            { state: 'idle', event: 'cooldown end', polite: [], assertive: [] },
            { state: 'idle', event: 'suspend on', polite: [], assertive: [] },
            { state: 'idle', event: 'suspend off', polite: [], assertive: [] },
            {
                state: 'idle',
                event: 'high priority announce while suspended',
                polite: [],
                assertive: ['Connection lost'],
            },
            {
                state: 'cooling down, empty queue',
                event: 'polite announce',
                polite: ['Alice joined', 'Dave joined'],
                assertive: [],
            },
            { state: 'cooling down, empty queue', event: 'cooldown end', polite: ['Alice joined'], assertive: [] },
            { state: 'cooling down, empty queue', event: 'suspend on', polite: ['Alice joined'], assertive: [] },
            { state: 'cooling down, empty queue', event: 'suspend off', polite: ['Alice joined'], assertive: [] },
            {
                state: 'cooling down, empty queue',
                event: 'high priority announce while suspended',
                polite: ['Alice joined'],
                assertive: ['Connection lost'],
            },
            {
                state: 'cooling down, queued messages',
                event: 'polite announce',
                polite: ['Alice left', 'Bob left', 'Carol left', 'Dave joined'],
                assertive: [],
            },
            {
                state: 'cooling down, queued messages',
                event: 'cooldown end',
                polite: ['Alice left', 'Bob left', 'Carol left'],
                assertive: [],
            },
            // A reconnect announces a leave for every participant just before suspension starts.
            { state: 'cooling down, queued messages', event: 'suspend on', polite: ['Alice left'], assertive: [] },
            {
                state: 'cooling down, queued messages',
                event: 'suspend off',
                polite: ['Alice left', 'Bob left', 'Carol left'],
                assertive: [],
            },
            {
                state: 'cooling down, queued messages',
                event: 'high priority announce while suspended',
                polite: ['Alice left'],
                assertive: ['Connection lost'],
            },
        ])(
            '$state, then $event: polite writes $polite, assertive writes $assertive',
            ({ state, event, polite, assertive }) => {
                const { result } = renderAnnouncer();

                act(() => {
                    states[state](result.current);
                    events[event](result.current);
                });

                expect(writesWhileDraining()).toEqual({ polite, assertive });
            }
        );
    });

    it.each([
        { waiting: 'normal', priority: AnnouncementPriority.Normal, written: '' },
        { waiting: 'high', priority: AnnouncementPriority.High, written: 'Waiting message' },
    ])(
        'when suspension starts, a $waiting priority assertive message waiting behind a high priority one is written: "$written"',
        ({ priority, written }) => {
            const { result } = renderAnnouncer();

            act(() => {
                result.current.announce('You were muted', { priority: AnnouncementPriority.High });
                result.current.announce('Waiting message', { priority });
                result.current.setSuspendNonCritical(true);
            });
            advance(100);
            expect(regionTexts()).toEqual(['You were muted', '']);

            advance(800);
            expect(regionTexts()).toEqual(['You were muted', written]);
        }
    );
});

describe('useAnnounce without a provider', () => {
    it('does nothing', () => {
        const { result } = renderHook(() => useAnnounce());

        act(() => result.current('Alice joined'));

        expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(0);
    });
});
