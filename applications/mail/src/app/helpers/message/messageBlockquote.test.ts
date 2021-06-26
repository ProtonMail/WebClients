import { locateBlockquote } from './messageBlockquote';
import mails from './__fixtures__/messageBlockquote.fixtures';

/**
 * Creating a whole document each time is needed because locate blockquote is using xpath request
 * which will fail if the content is not actually in the document
 */
const createDocument = (content: string) => {
    const newDocument = document.implementation.createHTMLDocument();
    newDocument.body.innerHTML = content;
    return newDocument.body;
};

describe('messageBlockquote', () => {
    Object.entries(mails as { [name: string]: string }).forEach(([name, content]) => {
        it(`should find the blockquote in the mail ${name}`, () => {
            const [, blockquote] = locateBlockquote(createDocument(content));
            expect(blockquote.length).not.toBe(0);
        });
    });
});
