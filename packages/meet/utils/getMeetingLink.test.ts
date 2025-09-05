import { getMeetingLink } from './getMeetingLink';

describe('getMeetingLink', () => {
    it('should return a valid meeting link', () => {
        const meetingId = 'abc123';
        const password = 'password123';
        const link = getMeetingLink(meetingId, password);
        expect(link).toBe(`/join/id-${meetingId}#pwd-${password}`);
    });
});
