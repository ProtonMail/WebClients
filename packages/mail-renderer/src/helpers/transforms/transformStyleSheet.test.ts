import { neutralizeStyleBreakout, transformStylesheet } from './transformStylesheet';

describe('neutralizeStyleBreakout', () => {
    it('should escape a </style> breakout smuggled into CSS text', () => {
        const input = '.x { content: "</style><img src=x onerror=alert(1)>"; }';
        const output = neutralizeStyleBreakout(input);

        expect(output).not.toContain('</');
        expect(output).toContain('\\3c /style>');
    });

    it('should neutralize any "</" sequence regardless of the following tag name', () => {
        expect(neutralizeStyleBreakout('a</STYLE b')).toBe('a\\3c /STYLE b');
        expect(neutralizeStyleBreakout('a</div b')).toBe('a\\3c /div b');
    });

    it('should preserve valid range media queries with < and >', () => {
        const input = '@media (width > 600px) and (100px < height) { a { color: red } }';
        expect(neutralizeStyleBreakout(input)).toBe(input);
    });

    it('should not alter a standalone < not followed by a slash', () => {
        expect(neutralizeStyleBreakout('a < b')).toBe('a < b');
    });
});

describe('transformStylesheet', () => {
    let element: Element;

    beforeEach(() => {
        element = document.body;
    });

    it('should replace fixed position with inherit in style tags', () => {
        element.innerHTML = '<style>div { position: fixed; }</style>';
        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toContain('div { position: inherit !important; }');
    });

    it('should replace sticky position with inherit in style tags', () => {
        element.innerHTML = '<style>div { position: sticky; }</style>';
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

    it('should neutralize a </style> breakout re-introduced when reconstructing height-query styles', () => {
        element.innerHTML = `
        <style>
            .x { content: "</style><img src=x onerror=alert(1)>"; }

            @media (max-height: 768px) {
                article { font-size: 4rem; }
            }
        </style>
        `;

        transformStylesheet(element);
        const styleTag = element.querySelector('style');

        expect(styleTag?.textContent).not.toContain('</');
    });

    it('should replace min-height: 100vh with min-height: auto', () => {
        element.innerHTML = '<style>div { min-height: 100vh; }</style>';
        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toBe('div { min-height: auto; }');
    });
    it('should replace min-height: 100vh with min-block-size: auto', () => {
        element.innerHTML = '<style>div { min-block-size: 100vh; }</style>';
        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toBe('div { min-block-size: auto; }');
    });
});
