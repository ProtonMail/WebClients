import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { hasVideoConf } from './utils';

describe('hasVideoConf', () => {
    it('should return true if the conference is a Zoom meeting', () => {
        const conferenceId = '1234567890';
        const conferenceUrl = 'https://zoom.us/j/1234567890';
        const conferenceProvider = VIDEO_CONFERENCE_PROVIDER.ZOOM;
        expect(hasVideoConf(conferenceId, conferenceUrl, conferenceProvider)).toBe(true);
    });

    it('should return true if the conference is a Proton Meet meeting', () => {
        const conferenceId = '1234567890';
        const conferenceUrl = 'https://meet.proton.me/1234567890';
        const conferenceProvider = VIDEO_CONFERENCE_PROVIDER.PROTON_MEET;
        expect(hasVideoConf(conferenceId, conferenceUrl, conferenceProvider)).toBe(true);
    });

    it('should return false if the conference is not a Zoom or Proton Meet meeting', () => {
        const conferenceId = '1234567890';
        const conferenceUrl = 'https://example.com/1234567890';
        const conferenceProvider = 123;
        // @ts-expect-error - we want to test the case where the conferenceProvider is not provided properly
        expect(hasVideoConf(conferenceId, conferenceUrl, conferenceProvider)).toBe(false);
    });

    it('should return false if the conferenceId is not provided', () => {
        const conferenceUrl = 'https://example.com/1234567890';
        const conferenceProvider = VIDEO_CONFERENCE_PROVIDER.ZOOM;
        expect(hasVideoConf(undefined, conferenceUrl, conferenceProvider)).toBe(false);
    });

    it('should return false if the conferenceUrl is not provided', () => {
        const conferenceId = '1234567890';
        const conferenceProvider = VIDEO_CONFERENCE_PROVIDER.ZOOM;
        expect(hasVideoConf(conferenceId, undefined, conferenceProvider)).toBe(false);
    });

    it('should return false if the conferenceProvider is not provided', () => {
        const conferenceId = '1234567890';
        const conferenceUrl = 'https://example.com/1234567890';
        expect(hasVideoConf(conferenceId, conferenceUrl, undefined)).toBe(false);
    });
});
