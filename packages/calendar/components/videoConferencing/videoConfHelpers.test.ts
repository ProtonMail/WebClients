import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { VIDEO_CONF_SERVICES } from './constants';
import { SEPARATOR_PROTON_EVENTS } from './constants';
import {
    addVideoConfInfoToDescription,
    isVideoConfOnlyLink,
    removeVideoConfInfoFromDescription,
} from './videoConfHelpers';

describe('video conf helpers', () => {
    describe('isVideoConfOnlyLink', () => {
        it('should return true if only contains meetingURL', () => {
            expect(
                isVideoConfOnlyLink({
                    service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
                    meetingUrl: 'https://example.com/meeting',
                })
            ).toBe(true);
        });

        it('should return false if contains more than meetingURL', () => {
            expect(
                isVideoConfOnlyLink({
                    service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
                    meetingUrl: 'https://example.com/meeting',
                    password: 'password',
                })
            ).toBe(false);

            expect(
                isVideoConfOnlyLink({
                    service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
                    meetingUrl: 'https://example.com/meeting',
                    meetingId: '123456',
                })
            ).toBe(false);

            expect(
                isVideoConfOnlyLink({
                    service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
                    meetingUrl: 'https://example.com/meeting',
                    joiningInstructions: 'instructions',
                })
            ).toBe(false);
        });
    });

    const baseZoomParams = {
        meedingURL: 'https://zoom.us/j/123456789',
        meetingId: '123456789',
        provider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
    };

    const baseProtonParams = {
        meedingURL: 'https://meet.proton.me/meeting123',
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
                    meedingURL: undefined,
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
                `Join Zoom Meeting: ${baseZoomParams.meedingURL} (ID: ${baseZoomParams.meetingId}, passcode: 123456)`,
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
                `Join Proton Meet: ${baseProtonParams.meedingURL} (ID: ${baseProtonParams.meetingId})`,
                '',
                'Meeting host: Jane Smith',
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
                `Join Zoom Meeting: ${baseZoomParams.meedingURL} (ID: ${baseZoomParams.meetingId})`,
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
                `Join Proton Meet: ${baseProtonParams.meedingURL} (ID: ${baseProtonParams.meetingId})`,
                '',
                '',
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
                `Join Zoom Meeting: ${baseZoomParams.meedingURL} (ID: ${baseZoomParams.meetingId})`,
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
                `Join Zoom Meeting: ${baseZoomParams.meedingURL} (ID: ${baseZoomParams.meetingId})`,
                SEPARATOR_PROTON_EVENTS,
                'Notes',
                SEPARATOR_PROTON_EVENTS,
                `Join Proton Meet: ${baseProtonParams.meedingURL} (ID: ${baseProtonParams.meetingId})`,
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
                `Join Zoom Meeting: ${baseZoomParams.meedingURL} (ID: ${baseZoomParams.meetingId})`,
                SEPARATOR_PROTON_EVENTS,
            ].join('\n');

            expect(removeVideoConfInfoFromDescription(description)).toBe('');
        });

        it('should handle empty description', () => {
            expect(removeVideoConfInfoFromDescription('')).toBe('');
        });
    });
});
