import { removeTrailingSlash } from './remove-trailing-slash';

describe('removeTrailingSlash', () => {
    it('should remove trailing slash', () => {
        const link = 'https://meet.proton.me/meeting/id-abc123/';
        const result = removeTrailingSlash(link);
        expect(result).toBe('https://meet.proton.me/meeting/id-abc123');
    });

    it('should not remove trailing slash if it is not present', () => {
        const link = 'https://meet.proton.me/meeting/id-abc123';
        const result = removeTrailingSlash(link);
        expect(result).toBe('https://meet.proton.me/meeting/id-abc123');
    });
});
