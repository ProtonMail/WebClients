import { transformLinks } from './transformLinks';

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
        <a href="https://ads.com?utm_content=toto">utm</a>
        <div href id="hrefLink">xxxx</div>
    `;

    const EMPTY_LINK = '<a>anchor</a>';

    const setup = (content = ADD_REF) => {
        const doc = document.createElement('DIV');
        doc.innerHTML = content;

        transformLinks(doc, jest.fn(), true);

        const querySelector = (selectors: string) => doc.querySelector(selectors);
        const querySelectorAll = (selectors: string) => [...doc.querySelectorAll(selectors)];

        return { document: doc, querySelector, querySelectorAll };
    };

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    describe('Improve privacy', () => {
        const TOTAL = ADD_REF.split('\n')
            .map((s) => s.trim())
            .filter(Boolean).length;

        it('should add referrer', () => {
            const { querySelectorAll } = setup();
            expect(querySelectorAll('[rel="noreferrer nofollow noopener"]').length).toEqual(TOTAL);
        });

        it('should strip tracking parameters (utm)', () => {
            const { querySelector } = setup(ADD_REF);
            expect(querySelector('[href="https://ads.com/"]')).toBeTruthy();
            expect(querySelector('[href*="utm_content=toto"]')).toBeFalsy();
        });
    });

    describe('Keep the message in its frame', () => {
        it('should add target for real link', () => {
            const { querySelectorAll } = setup();
            expect(querySelectorAll('[target="_blank"]').length).toEqual(8);
            expect(querySelectorAll('[href^="http"][target="_blank"]').length).toEqual(4);
            expect(querySelectorAll('[href^="mailto"][target="_blank"]').length).toEqual(0);
        });

        it('should add target to schemes that would otherwise navigate the containing frame', () => {
            const { querySelectorAll } = setup(`
                <a id="tel" href="tel:+15551234567">tel</a>
                <a id="callto" href="callto:+15551234567">callto</a>
                <a id="xmpp" href="xmpp:someone@example.com">xmpp</a>
                <a id="ftp" href="ftp://example.com/file">ftp</a>
                <a id="cid" href="cid:part1@example.com">cid</a>
                <a id="data" href="data:text/html,hello">data</a>
                <a id="blob" href="blob:https://example.com/uuid">blob</a>
                <a href="mailto://lol.jpg">mailto</a>
            `);
            expect(querySelectorAll('[target="_blank"]').length).toEqual(7);
        });

        it('should not add target to fragments or mailto', () => {
            const { querySelector } = setup(`
                <a id="fragment" href="#section">anchor</a>
                <a id="mail" href="mailto:someone@example.com">mailto</a>
            `);
            expect(querySelector('#fragment')?.hasAttribute('target')).toBe(false);
            expect(querySelector('#mail')?.hasAttribute('target')).toBe(false);
        });
    });

    describe('Fix links', () => {
        it('should add domain in from of the link relative', () => {
            const { querySelector } = setup(ADD_REF + EMPTY_LINK);
            expect(querySelector('[href="https:///monique"]')).toBeTruthy();
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

        it('should add target and http to link', () => {
            const { querySelector } = setup('<a id="test-link" href="testing.com">testing</a>');
            expect(querySelector('#test-link')?.getAttribute('target')).toBe('_blank');
            expect(querySelector('#test-link')?.getAttribute('href')).toBe('https://testing.com');
        });

        it('should set word-break on long link text without wrap opportunities', () => {
            const longRun = 'loremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsum';
            const { querySelector } = setup(`<a id="long-run" href="https://example.com">${longRun}</a>`);
            expect((querySelector('#long-run') as HTMLElement).style.wordBreak).toBe('break-word');
        });

        it('should not set word-break when long text is breakable at spaces', () => {
            const text = 'short words repeated short words repeated short words repeated short words repeated';
            const { querySelector } = setup(`<a id="breakable" href="https://example.com">${text}</a>`);
            expect((querySelector('#breakable') as HTMLElement).style.wordBreak).toBe('');
        });

        it('should set word-break when many inline spans concatenate to a long unbroken run', () => {
            const spans = Array.from({ length: 12 }, () => '<span>lorem</span>').join('');
            const { querySelector } = setup(`<a id="spans" href="https://example.com">${spans}</a>`);
            expect((querySelector('#spans') as HTMLElement).style.wordBreak).toBe('break-word');
        });
        it('should set word-break when many inline spans concatenate to a long unbroken run with unbreakable characters', () => {
            const spans = Array.from({ length: 12 }, () => '<span>lorem&nbsp;</span>').join('');
            const { querySelector } = setup(`<a id="spans" href="https://example.com">${spans}</a>`);
            expect((querySelector('#spans') as HTMLElement).style.wordBreak).toBe('break-word');
        });
    });
});
