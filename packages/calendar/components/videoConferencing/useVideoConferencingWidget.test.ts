import { renderHook } from '@testing-library/react-hooks';

import type { EventModelReadView } from '@proton/shared/lib/interfaces/calendar/Event';

import { useVideoConferencingWidget } from './useVideoConferencingWidget';

const videoConferenceTestData = [
    ['Proton Meet', 'https://meet.proton.me/join/id-1234567890#pwd-1234567890'],
    ['Zoom', 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1'],
    ['Google Meet', 'https://meet.google.com/xxx-yyyy-zzz'],
    ['Slack Huddle', 'https://app.slack.com/huddle/SOMETHING/SOMETHING_ELSE'],
    ['Teams', 'https://teams.live.com/meet/9346628868165?p=IuBKlitIxSGksLCMG8'],
] as const;

jest.mock('../videoConferencing/useVideoConfTelemetry', () => ({
    ...jest.requireActual('../videoConferencing/useVideoConfTelemetry'),
    useVideoConfTelemetry: jest.fn().mockReturnValue({
        sendEventVideoConfSource: jest.fn(),
    }),
}));

jest.mock('@proton/unleash/useFlag', () => jest.fn().mockReturnValue(true));

describe('useVideoConferencingWidget', () => {
    const createMockEvent = (description: string, location: string): EventModelReadView =>
        ({
            description,
            location,
        }) as EventModelReadView;

    describe('No valid video conference data', () => {
        it('should return null when no valid video conference link is found in description or location', () => {
            const model = createMockEvent('Some regular description', 'Some regular location');
            const { result: videoConferencingWidget } = renderHook(() =>
                useVideoConferencingWidget({ model, widgetLocation: 'event-details' })
            );
            expect(videoConferencingWidget.current).toBe(null);
        });
    });

    describe('Valid video conference links in description', () => {
        it.each(videoConferenceTestData)(
            'should return component when %s link is found in description',
            (service, link) => {
                const model = createMockEvent(link, '');
                const { result: videoConferencingWidget } = renderHook(() =>
                    useVideoConferencingWidget({ model, widgetLocation: 'event-details' })
                );
                expect(videoConferencingWidget.current).not.toBe(null);
            }
        );
    });

    describe('Valid video conference links in location', () => {
        it.each(videoConferenceTestData)(
            'should return component when %s link is found in location',
            (service, link) => {
                const model = createMockEvent('', link);
                const { result: videoConferencingWidget } = renderHook(() =>
                    useVideoConferencingWidget({ model, widgetLocation: 'event-details' })
                );
                expect(videoConferencingWidget.current).not.toBe(null);
            }
        );
    });
});
