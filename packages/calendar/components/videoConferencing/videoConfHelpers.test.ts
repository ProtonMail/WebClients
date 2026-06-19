import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { SEPARATOR_PROTON_EVENTS, VIDEO_CONF_SERVICES } from './constants';
import {
    addVideoConfInfoToDescription,
    getSafeConferenceUrl,
    isVideoConfOnlyLink,
    removeVideoConfInfoFromDescription,
} from './videoConfHelpers';

describe('video conf helpers', () => {
    describe('getSafeConferenceUrl', () => {
        it('should return the URL unchanged for valid https URLs', () => {
            expect(getSafeConferenceUrl('https://zoom.us/j/123456789')).toBe('https://zoom.us/j/123456789');
            expect(getSafeConferenceUrl('https://meet.google.com/abc-defg-hij')).toBe(
                'https://meet.google.com/abc-defg-hij'
            );
            expect(getSafeConferenceUrl('https://meet.proton.me/join/id-abc123#pwd-xyz')).toBe(
                'https://meet.proton.me/join/id-abc123#pwd-xyz'
            );
        });

        it('should upgrade http URLs to https', () => {
            expect(getSafeConferenceUrl('http://zoom.us/j/123')).toBe('https://zoom.us/j/123');
        });

        it('should return undefined for non-https protocols', () => {
            expect(getSafeConferenceUrl('ftp://zoom.us/files')).toBeUndefined();
            expect(getSafeConferenceUrl('mailto:attacker@evil.com')).toBeUndefined();
        });

        it('should return undefined for OS protocol handler exploits', () => {
            expect(
                getSafeConferenceUrl('search-ms:query=zoom.us&crumb=location:\\\\attacker-ip\\zoom.us')
            ).toBeUndefined();
            expect(getSafeConferenceUrl('calculator://zoom.us/poc')).toBeUndefined();
            expect(getSafeConferenceUrl('ms-settings:defaultapps')).toBeUndefined();
            expect(getSafeConferenceUrl('file:///etc/passwd')).toBeUndefined();
            expect(getSafeConferenceUrl('javascript:alert(1)')).toBeUndefined();
        });

        it('should return undefined for undefined or empty input', () => {
            expect(getSafeConferenceUrl(undefined)).toBeUndefined();
            expect(getSafeConferenceUrl('')).toBeUndefined();
        });

        it('should return undefined for malformed URLs', () => {
            expect(getSafeConferenceUrl('not a url')).toBeUndefined();
            expect(getSafeConferenceUrl('://missing-scheme')).toBeUndefined();
        });
    });

    describe('isVideoConfOnlyLink', () => {
        it('should return true if only contains meetingURL', () => {
            expect(
                isVideoConfOnlyLink(
                    { service: VIDEO_CONF_SERVICES.GOOGLE_MEET, meetingUrl: 'https://example.com/meeting' },
                    undefined
                )
            ).toBe(true);
        });

        it('should return false if contains more than meetingURL', () => {
            expect(
                isVideoConfOnlyLink(
                    {
                        service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
                        meetingUrl: 'https://example.com/meeting',
                        password: 'password',
                    },
                    undefined
                )
            ).toBe(false);

            expect(
                isVideoConfOnlyLink(
                    {
                        service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
                        meetingUrl: 'https://example.com/meeting',
                        meetingId: '123456',
                    },
                    undefined
                )
            ).toBe(false);

            expect(
                isVideoConfOnlyLink(
                    { service: VIDEO_CONF_SERVICES.GOOGLE_MEET, meetingUrl: 'https://example.com/meeting' },
                    'https://support.google.com/a/users/answer/9300131'
                )
            ).toBe(false);
        });
    });

    const baseZoomParams = {
        meetingURL: 'https://zoom.us/j/123456789',
        meetingId: '123456789',
        provider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
    };

    const baseProtonParams = {
        meetingURL: 'https://meet.proton.me/meeting123',
        meetingId: 'meeting123',
        provider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
    };

    describe('addVideoConfInfoToDescription', () => {
        it('should return original description if required fields are missing', () => {
            const description = 'Original description';

            expect(addVideoConfInfoToDescription({ description })).toBe(description);
            expect(
                addVideoConfInfoToDescription({
                    ...baseZoomParams,
                    meetingId: undefined,
                    description,
                })
            ).toBe(description);

            expect(
                addVideoConfInfoToDescription({
                    ...baseZoomParams,
                    meetingURL: undefined,
                    description,
                })
            ).toBe(description);

            expect(
                addVideoConfInfoToDescription({
                    ...baseZoomParams,
                    provider: undefined,
                    description,
                })
            ).toBe(description);
        });

        it('should add Zoom meeting info correctly', () => {
            const result = addVideoConfInfoToDescription({
                ...baseZoomParams,
                password: '123456',
                host: 'John Doe',
            });

            const expected = [
                '',
                SEPARATOR_PROTON_EVENTS,
                `Join Zoom Meeting: ${baseZoomParams.meetingURL} (ID: ${baseZoomParams.meetingId}, passcode: 123456)`,
                '',
                'Meeting host: John Doe',
                SEPARATOR_PROTON_EVENTS,
            ].join('\n');

            expect(result).toBe(expected);
        });

        it('should add Proton Meet info correctly', () => {
            const result = addVideoConfInfoToDescription({
                ...baseProtonParams,
                host: 'Jane Smith',
            });

            const expected = [
                '',
                SEPARATOR_PROTON_EVENTS,
                `Join Proton Meet: ${baseProtonParams.meetingURL}`,
                SEPARATOR_PROTON_EVENTS,
            ].join('\n');

            expect(result).toBe(expected);
        });

        it('should append video info to existing description', () => {
            const description = 'Team meeting agenda';
            const result = addVideoConfInfoToDescription({
                ...baseZoomParams,
                description,
            });

            const expected = [
                description,
                SEPARATOR_PROTON_EVENTS,
                `Join Zoom Meeting: ${baseZoomParams.meetingURL} (ID: ${baseZoomParams.meetingId})`,
                '',
                '',
                SEPARATOR_PROTON_EVENTS,
            ].join('\n');

            expect(result).toBe(expected);
        });

        it('should handle missing optional fields', () => {
            const result = addVideoConfInfoToDescription(baseProtonParams);

            const expected = [
                '',
                SEPARATOR_PROTON_EVENTS,
                `Join Proton Meet: ${baseProtonParams.meetingURL}`,
                SEPARATOR_PROTON_EVENTS,
            ].join('\n');

            expect(result).toBe(expected);
        });
    });

    describe('removeVideoConfInfoFromDescription', () => {
        it('should remove video conference info from description', () => {
            const description = [
                'Meeting agenda',
                SEPARATOR_PROTON_EVENTS,
                `Join Zoom Meeting: ${baseZoomParams.meetingURL} (ID: ${baseZoomParams.meetingId})`,
                '',
                'Meeting host: John Doe',
                SEPARATOR_PROTON_EVENTS,
                'Additional notes',
            ].join('\n');

            expect(removeVideoConfInfoFromDescription(description)).toBe('Meeting agenda\nAdditional notes');
        });

        it('should handle multiple video conference blocks', () => {
            const description = [
                'Meeting agenda',
                SEPARATOR_PROTON_EVENTS,
                `Join Zoom Meeting: ${baseZoomParams.meetingURL} (ID: ${baseZoomParams.meetingId})`,
                SEPARATOR_PROTON_EVENTS,
                'Notes',
                SEPARATOR_PROTON_EVENTS,
                `Join Proton Meet: ${baseProtonParams.meetingURL}`,
                SEPARATOR_PROTON_EVENTS,
                'End',
            ].join('\n');

            expect(removeVideoConfInfoFromDescription(description)).toBe('Meeting agenda\nNotes\nEnd');
        });

        it('should return original description if no video conference info exists', () => {
            const description = 'Regular meeting notes without video conference info';
            expect(removeVideoConfInfoFromDescription(description)).toBe(description);
        });

        it('should handle description with only video conference info', () => {
            const description = [
                SEPARATOR_PROTON_EVENTS,
                `Join Zoom Meeting: ${baseZoomParams.meetingURL} (ID: ${baseZoomParams.meetingId})`,
                SEPARATOR_PROTON_EVENTS,
            ].join('\n');

            expect(removeVideoConfInfoFromDescription(description)).toBe('');
        });

        it('should handle empty description', () => {
            expect(removeVideoConfInfoFromDescription('')).toBe('');
        });
    });
});
