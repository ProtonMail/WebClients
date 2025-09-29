import { JSDOM } from 'jsdom';

import { transformStylesheet } from './transformStylesheet';

describe('transformStylesheet', () => {
    let element: Element;

    beforeEach(() => {
        const document = new JSDOM('<html><body></body></html>', { contentType: 'text/html' }).window.document;
        element = document.body;
    });

    it('should replace fixed position with inherit in style tags', () => {
        element.innerHTML = '<style>div { position: fixed; }</style>';
        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toContain('div { position: inherit !important; }');
    });

    it('should not change style content if there is no fixed position', () => {
        element.innerHTML = '<style>div { position: absolute; }</style>';
        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toBe('div { position: absolute; }');
    });

    it('should handle multiple style tags', () => {
        element.innerHTML = `
            <style>div { position: fixed; }</style>
            <style>span { position: fixed; }</style>
        `;
        transformStylesheet(element);
        const styleTags = element.querySelectorAll('style');

        expect(styleTags[0].textContent).toBe('div { position: inherit !important; }');
        expect(styleTags[1].textContent).toBe('span { position: inherit !important; }');
    });

    it('should remove height-dependent media queries', () => {
        element.innerHTML = `
        <style>
            article { padding: 1rem; }

            @media (height >= 960px) {
                article { font-size: 2rem; }
            }

            @media screen and (min-height: 768px) {
                article { font-size: 3rem; }
            }

            @media (max-height: 768px) {
                article { font-size: 4rem; }
            }
        </style>
        `;

        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toBe('article {padding: 1rem;}\n');
    });

    it('should remove height-dependant container queries', () => {
        element.innerHTML = `
        <style>
            article { padding: 1rem; }

            @container (height >= 960px) {
                article { font-size: 2rem; }
            }

            @container screen and (min-height: 768px) {
                article { font-size: 3rem; }
            }

            @container (max-height: 768px) {
                article { font-size: 4rem; }
            }
        </style>
        `;

        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toBe('article {padding: 1rem;}\n');
    });
});
