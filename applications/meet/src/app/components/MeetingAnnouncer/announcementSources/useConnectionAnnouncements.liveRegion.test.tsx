import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { LiveAnnouncerProvider } from '@proton/components/components/liveAnnouncer/LiveAnnouncerProvider';

import type { ConnectionStatus } from '../../../hooks/useConnectionStatus/useConnectionStatus';
import { useConnectionAnnouncements } from './useConnectionAnnouncements';

const wrapper = ({ children }: { children: ReactNode }) => <LiveAnnouncerProvider>{children}</LiveAnnouncerProvider>;

const assertiveRegionTexts = () =>
    Array.from(document.body.querySelectorAll('[aria-live="assertive"]')).map((region) => region.textContent ?? '');

const TICK_MS = 50;

const renderAnnouncementsInLiveRegions = () => {
    const heard: string[] = [];
    let previousTexts = assertiveRegionTexts();

    const { rerender } = renderHook((phase: ConnectionStatus['phase']) => useConnectionAnnouncements(phase), {
        initialProps: 'connected',
        wrapper,
    });

    const tick = () => {
        act(() => {
            vi.advanceTimersByTime(TICK_MS);
        });
        const texts = assertiveRegionTexts();
        texts.forEach((text, index) => {
            if (text && text !== previousTexts[index]) {
                heard.push(text);
            }
        });
        previousTexts = texts;
    };

    const wait = (ms: number) => {
        for (let elapsed = 0; elapsed < ms; elapsed += TICK_MS) {
            tick();
        }
    };

    return { setPhase: rerender, wait, heard };
};

describe('useConnectionAnnouncements in the live regions', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('announces a recovery that follows a second loss within a few seconds of the first recovery', () => {
        const { setPhase, wait, heard } = renderAnnouncementsInLiveRegions();

        setPhase('reconnecting');
        wait(3500);
        setPhase('reconnected');
        wait(500);
        setPhase('reconnecting');
        wait(1000);
        setPhase('reconnected');
        wait(1500);

        expect(heard).toEqual([
            'Connection lost. Reconnecting…',
            'Reconnected',
            'Connection lost. Reconnecting…',
            'Reconnected',
        ]);
    });

    it('announces a second loss that follows a fast recovery', () => {
        const { setPhase, wait, heard } = renderAnnouncementsInLiveRegions();

        setPhase('reconnecting');
        wait(1000);
        setPhase('reconnected');
        wait(1000);
        setPhase('reconnecting');
        wait(1500);

        expect(heard).toEqual(['Connection lost. Reconnecting…', 'Reconnected', 'Connection lost. Reconnecting…']);
    });
});
