import { parseMeetingLink } from './parseMeetingLink';

describe('parseMeetingLink', () => {
    it('should parse a valid meeting link', () => {
        const link = 'https://meet.proton.me/meeting/id-abc123#pwd-password123';
        const result = parseMeetingLink(link);

        expect(result).toEqual({
            meetingId: 'abc123',
            urlPassword: 'password123',
        });
    });

    it('should throw error when missing password part', () => {
        const link = 'https://meet.proton.me/meeting/id-abc123';

        // @ts-ignore
        expect(() => parseMeetingLink(link)).toThrowError('Invalid meeting link');
    });

    it('should throw error when missing id- prefix', () => {
        const link = 'https://meet.proton.me/meeting/abc123#pwd-password123';

        // @ts-ignore
        expect(() => parseMeetingLink(link)).toThrowError('Invalid meeting link');
    });

    it('should throw error when missing pwd- prefix', () => {
        const link = 'https://meet.proton.me/meeting/id-abc123#password123';

        // @ts-ignore
        expect(() => parseMeetingLink(link)).toThrowError('Invalid meeting link');
    });
});
