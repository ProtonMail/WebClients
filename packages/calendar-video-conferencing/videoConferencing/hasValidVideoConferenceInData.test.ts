import type { EventModelReadView } from '@proton/shared/lib/interfaces/calendar/Event';

import { hasValidVideoConferenceInData } from './hasValidVideoConferenceInData';

const videoConferenceTestData = [
    ['Proton Meet', 'https://meet.proton.me/join/id-1234567890#pwd-1234567890'],
    ['Zoom', 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1'],
    ['Google Meet', 'https://meet.google.com/xxx-yyyy-zzz'],
    ['Slack Huddle', 'https://app.slack.com/huddle/SOMETHING/SOMETHING_ELSE'],
    ['Teams', 'https://teams.live.com/meet/9346628868165?p=IuBKlitIxSGksLCMG8'],
] as const;

describe('hasValidVideoConferenceInData', () => {
    // Simple mock that only includes the properties needed by the function under test
    const createMockEvent = (description?: string, location?: string): EventModelReadView =>
        ({
            description,
            location,
        }) as EventModelReadView;

    describe('No valid video conference data', () => {
        it('should return false when no valid video conference link is found in description or location', () => {
            const model = createMockEvent('Some regular description', 'Some regular location');
            expect(hasValidVideoConferenceInData(model)).toBe(false);
        });
    });

    describe('Valid video conference links in description', () => {
        it.each(videoConferenceTestData)('should return true when %s link is found in description', (service, link) => {
            const model = createMockEvent(link);
            expect(hasValidVideoConferenceInData(model)).toBe(true);
        });
    });

    describe('Valid video conference links in location', () => {
        it.each(videoConferenceTestData)('should return true when %s link is found in location', (service, link) => {
            const model = createMockEvent(undefined, link);
            expect(hasValidVideoConferenceInData(model)).toBe(true);
        });
    });
});
