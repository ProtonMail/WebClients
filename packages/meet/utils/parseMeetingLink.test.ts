import { parseMeetingLink } from './parseMeetingLink';

describe('parseMeetingLink', () => {
    it('should parse a valid meeting link', () => {
        const link = 'https://meet.proton.me/meeting/id-abcdefghij#pwd-password1234';
        const result = parseMeetingLink(link);

        expect(result).toEqual({
            meetingId: 'abcdefghij',
            urlPassword: 'password1234',
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
