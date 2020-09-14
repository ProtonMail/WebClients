import { generateAttendeeToken } from '../../lib/calendar/attendees';

const expectedToken = 'c2d3d0b4eb4ef80633f9cc7755991e79ca033016';

describe('generateAttendeeToken()', () => {
    it('should produce correct tokens', async () => {
        const token = await generateAttendeeToken('james@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
    });
});
