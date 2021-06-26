import { transformLinks } from '../transformLinks';

describe('transformLinks service', () => {
    const ADD_REF = `
        <a href="#lol" id="anchorLink">anchor</a>
        <a href="" id="emptyLink">nada</a>
        <a href="/monique">relative</a>
        <a href="https://lol.jpg">https</a>
        <a href="http://lol.jpg">http</a>
        <a href="ftp://lol.jpg">ftp</a>
        <a href="xmpp://lol.jpg">xmpp</a>
        <a href="tel://lol.jpg">tel</a>
        <a href="callto://lol.jpg">callto</a>
        <a href="mailto://lol.jpg">mailto</a>
        <div href id="hrefLink">xxxx</div>
    `;

    const EMPTY_LINK = '<a>anchor</a>';

    const setup = (content = ADD_REF) => {
        const doc = document.createElement('DIV');
        doc.innerHTML = content;

        transformLinks(doc);

        const querySelector = (selectors: string) => doc.querySelector(selectors);
        const querySelectorAll = (selectors: string) => [...doc.querySelectorAll(selectors)];

        return { document: doc, querySelector, querySelectorAll };
    };

    describe('Improve privacy', () => {
        const TOTAL = ADD_REF.split('\n')
            .map((s) => s.trim())
            .filter(Boolean).length;

        it('should add referrer', () => {
            const { querySelectorAll } = setup();
            expect(querySelectorAll('[rel="noreferrer nofollow noopener"]').length).toEqual(TOTAL);
        });

        it('should add target for real link', () => {
            const { querySelectorAll } = setup();
            expect(querySelectorAll('[target="_blank"]').length).toEqual(3);
            expect(querySelectorAll('[href^="http"][target="_blank"]').length).toEqual(3);
        });
    });

    describe('Fix links', () => {
        it('should add domain in from of the link relative', () => {
            const { querySelector } = setup(ADD_REF + EMPTY_LINK);
            expect(querySelector('[href="http:///monique"]')).toBeTruthy();
        });

        it('should not do anything for an empty anchor tag', () => {
            const { querySelector } = setup(ADD_REF + EMPTY_LINK);
            expect(querySelector('a:not([href])')?.outerHTML).toEqual(EMPTY_LINK);
        });

        it('should add pointerEvents to an empty anchor or invalid', () => {
            const { querySelector, querySelectorAll } = setup(ADD_REF + EMPTY_LINK);
            expect(querySelectorAll('[style]').length).toBe(2);
            expect((querySelector('#emptyLink') as HTMLElement).style.pointerEvents).toBe('none');
            expect((querySelector('#hrefLink') as HTMLElement).style.pointerEvents).toBe('none');
        });

        it('should not escape the anchor link', () => {
            const { querySelector } = setup(ADD_REF + EMPTY_LINK);
            expect(querySelector('#anchorLink')?.hasAttribute('style')).toBe(false);
        });
    });
});
