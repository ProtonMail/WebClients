import { getPlainTextToRender, preparePlainText } from './transforms';

const body = '> <img src="x" onerror="alert(1)"> https://proton.me';
const escapedBody =
    '&gt; &lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt; <a target="_blank" rel="noreferrer nofollow noopener" href="https://proton.me">https://proton.me</a>';

describe('plain text transforms', () => {
    describe('preparePlainText', () => {
        it('should escape and linkify received messages', async () => {
            const { plainText } = await preparePlainText(body, false);

            expect(plainText).toBe(escapedBody);
        });

        it('should keep the raw text of drafts for the composer', async () => {
            const { plainText } = await preparePlainText(body, true);

            expect(plainText).toBe(body);
        });
    });

    describe('getPlainTextToRender', () => {
        it('should escape the raw text of drafts', () => {
            expect(getPlainTextToRender(body, true)).toBe(escapedBody);
        });

        it('should not escape received messages twice', () => {
            expect(getPlainTextToRender(escapedBody, false)).toBe(escapedBody);
        });

        it('should handle a missing body', () => {
            expect(getPlainTextToRender(undefined, true)).toBe('');
            expect(getPlainTextToRender(undefined, false)).toBe('');
        });
    });
});
