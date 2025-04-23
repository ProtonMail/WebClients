import { VIDEO_CONF_SERVICES } from './constants';
import { isVideoConfOnlyLink } from './videoConfHelpers';

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
});
