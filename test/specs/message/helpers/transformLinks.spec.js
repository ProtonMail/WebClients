import factory from '../../../../src/app/message/helpers/transformLinks';

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

    let output;

    const dom = (html) => {
        const div = document.createElement('DIV');
        div.innerHTML = html;
        return div;
    };

    describe('Improve privacy', () => {

        const TOTAL = ADD_REF.split('\n').map((s) => s.trim()).filter(Boolean).length;

        beforeEach(() => {
            output = factory(dom(ADD_REF));
        });

        it('should add referrer', () => {
            expect(output.querySelectorAll('[rel="noreferrer nofollow noopener"]').length).toEqual(TOTAL);
        });

        it('should add target for real link', () => {
            expect(output.querySelectorAll('[target="_blank"]').length).toEqual(3);
            expect(output.querySelectorAll('[href^="http"][target="_blank"]').length).toEqual(3);
        });
    });

    describe('Fix links', () => {

        beforeEach(() => {
            output = factory(dom(ADD_REF + EMPTY_LINK));
        });

        it('should add domain in from of the link relative', () => {
            expect(output.querySelector('[href="http:///monique"]')).toBeTruthy();
        });

        it('should not do anything for an empty anchor tag', () => {
            expect(output.querySelector('a:not([href])').outerHTML).toEqual(EMPTY_LINK);
        });

        it('should add pointerEvents to an empty anchor or invalid', () => {
            expect(output.querySelectorAll('[style]').length).toBe(2);
            expect(output.querySelector('#emptyLink').style.pointerEvents).toBe('none');
            expect(output.querySelector('#hrefLink').style.pointerEvents).toBe('none');
        });

        it('should not escape the anchor link', () => {
            expect(output.querySelector('#anchorLink').hasAttribute('style')).toBe(false);
        });
    });


});
