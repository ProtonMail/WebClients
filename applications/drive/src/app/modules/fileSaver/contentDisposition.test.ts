import { getContentDisposition } from './contentDisposition';

describe('getContentDisposition', () => {
    it('should keep the encoded filename and add the RFC 6266 extended filename', () => {
        expect(getContentDisposition('Proton Drive Download - 2026-11-03.zip')).toBe(
            `attachment; filename="Proton%20Drive%20Download%20-%202026-11-03.zip"; filename*=UTF-8''Proton%20Drive%20Download%20-%202026-11-03.zip`
        );
    });

    it('should encode characters that are not allowed in the extended filename', () => {
        expect(getContentDisposition("it's (draft)*.txt")).toBe(
            `attachment; filename="it's%20(draft)*.txt"; filename*=UTF-8''it%27s%20%28draft%29%2A.txt`
        );
    });

    it('should encode non-ASCII characters as UTF-8', () => {
        expect(getContentDisposition('élan.zip')).toContain(`filename*=UTF-8''%C3%A9lan.zip`);
    });
});
