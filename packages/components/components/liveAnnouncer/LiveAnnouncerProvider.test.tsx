import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { LiveAnnouncerProvider } from './LiveAnnouncerProvider';
import { AnnouncementPriority } from './types';
import { useAnnounce, useSetSuspendNonCritical } from './useAnnounce';

const wrapper = ({ children }: { children: ReactNode }) => <LiveAnnouncerProvider>{children}</LiveAnnouncerProvider>;

const renderAnnouncer = () =>
    renderHook(() => ({ announce: useAnnounce(), setSuspendNonCritical: useSetSuspendNonCritical() }), { wrapper });

const regionTexts = () =>
    Array.from(document.body.querySelectorAll('[aria-live="assertive"]')).map((region) => region.textContent);

const advance = (ms: number) =>
    act(() => {
        jest.advanceTimersByTime(ms);
    });

describe('LiveAnnouncerProvider', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
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
});

describe('useAnnounce without a provider', () => {
    it('does nothing', () => {
        const { result } = renderHook(() => useAnnounce());

        act(() => result.current('Alice joined'));

        expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(0);
    });
});
