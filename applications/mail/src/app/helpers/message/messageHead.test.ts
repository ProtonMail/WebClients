import { locateHead } from '@proton/mail/helpers/locateHead';

import mails from './__fixtures__/messageHead.fixtures';

/**
 * Creating a whole document each time is needed because locate blockquote is using xpath request
 * which will fail if the content is not actually in the document
 */
const createDocument = (content: string) => {
    const newDocument = document.implementation.createHTMLDocument();
    newDocument.documentElement.innerHTML = content;
    return newDocument;
};

describe('messageHead', () => {
    it(`Should find head in a basic email`, () => {
        const head = locateHead(createDocument(mails.baseEmail));
        expect(head).toContain(`<style type="text/css">a {padding:0;}</style>`);
    });
});
