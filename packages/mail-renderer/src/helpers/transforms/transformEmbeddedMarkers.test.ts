import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';

import { transformEmbeddedMarkers } from './transformEmbeddedMarkers';

describe('transformEmbeddedMarkers', () => {
    const setup = (content: string) => {
        const document = parseDOMStringToBodyElement(content);

        transformEmbeddedMarkers(document);

        return document;
    };

    it('should remove sender supplied data-embedded-img attributes from any element', () => {
        const document = setup(`
            <img id="image" src="cid:image@example.com" data-embedded-img="cid:image@example.com">
            <span id="span" data-embedded-img="cid:victim@example.com"></span>
            <div id="empty" data-embedded-img="cid:"></div>
        `);

        expect(document.querySelectorAll('[data-embedded-img]').length).toBe(0);
        expect(document.querySelector('#image')?.getAttribute('src')).toBe('cid:image@example.com');
    });

    it('should remove rel attributes from elements without href', () => {
        const document = setup(`
            <span id="span" rel="cid:victim@example.com"></span>
            <a id="anchor" rel="cid:victim@example.com">anchor</a>
        `);

        expect(document.querySelector('#span')?.hasAttribute('rel')).toBe(false);
        expect(document.querySelector('#anchor')?.hasAttribute('rel')).toBe(false);
    });

    it('should keep rel attributes on links', () => {
        const document = setup('<a id="link" href="https://proton.me" rel="noreferrer nofollow noopener">link</a>');

        expect(document.querySelector('#link')?.getAttribute('rel')).toBe('noreferrer nofollow noopener');
    });
});
