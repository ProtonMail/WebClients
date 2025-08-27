import {
    handleNegativeMarginRemoval,
    handleTopLeftPropertiesRemoval,
    startsByANegativeSign,
    transformStyleAttributes,
} from './transformStyleAttributes';

describe('transformStyleAttributes', () => {
    const setup = () => {
        const doc = document.implementation.createHTMLDocument('test transform style attribute');

        return doc;
    };

    describe('replaceViewportHeightUnit', () => {
        it('Should remove VH from style attributes with height containing vh unit', () => {
            const document = setup();
            document.body.innerHTML = `
                <div id="a" style="margin: 0; width: 100vh; height: 100vh;">
                    <div id="b" style="margin: 0; width: 100px; height: 100px;">
                        <span id="c" style="margin: 0; width: 100px; height: 100vh;"></span>
                    </div>
                </div>
            `;

            const a = document.getElementById('a');
            const b = document.getElementById('b');
            const c = document.getElementById('c');

            expect(a?.style.height).toBe('100vh');
            expect(a?.style.width).toBe('100vh');
            expect(a?.style.margin).toBe('0px');
            expect(b?.style.height).toBe('100px');
            expect(b?.style.width).toBe('100px');
            expect(b?.style.margin).toBe('0px');
            expect(c?.style.height).toBe('100vh');
            expect(c?.style.width).toBe('100px');
            expect(c?.style.margin).toBe('0px');

            transformStyleAttributes(document.body as unknown as Element);

            expect(a?.style.height).toBe('auto');
            expect(a?.style.width).toBe('100vh');
            expect(a?.style.margin).toBe('0px');
            expect(b?.style.height).toBe('100px');
            expect(b?.style.width).toBe('100px');
            expect(b?.style.margin).toBe('0px');
            expect(c?.style.height).toBe('auto');
            expect(c?.style.width).toBe('100px');
            expect(c?.style.margin).toBe('0px');
        });
    });

    // had to extract the method for testing, because of a crazy issue of JSDOM - see after
    describe('handleTopLeftPropertiesRemoval', () => {
        it('Should remove top and left from style attributes', () => {
            const a = handleTopLeftPropertiesRemoval({ top: '12px', left: '4ex' });

            expect(a.keys()).toContain('top');
            expect(a.keys()).toContain('left');
            a.forEach((value) => {
                expect(value).toBe('unset');
            });
        });
    });

    describe('replaceLeftTopProperties', () => {
        it('Should remove width/height = 1px if left is present', () => {
            const document = setup();
            document.body.innerHTML = `
                <div id="a" style="position: relative; left: 0; width: 1px; height: 1px;">
                </div>
            `;

            transformStyleAttributes(document.body as unknown as Element);

            const a = document.getElementById('a');
            expect(a?.style.height).toBe('auto');
            expect(a?.style.width).toBe('auto');
        });
    });

    // had to extract the method, because of a crazy issue
    // expect(a?.style.left).toBe('unset'); don't work because JSDOM does not support unset: https://github.com/jsdom/jsdom/issues/3833
    describe('handleNegativeMarginRemoval', () => {
        it('Should remove negative values for margin from style attributes', () => {
            const a = handleNegativeMarginRemoval({
                marginLeft: '-12px',
                marginRight: '-4ex',
                marginTop: '-1mm',
                marginBottom: '-1em',
                marginInlineStart: '-1pt',
                marginInlineEnd: '-1pc',
                marginBlockStart: '-1%',
                marginBlockEnd: '-1vh',
            });

            expect(a.keys()).toContain('marginLeft');
            expect(a.keys()).toContain('marginRight');
            expect(a.keys()).toContain('marginTop');
            expect(a.keys()).toContain('marginBottom');
            expect(a.keys()).toContain('marginInlineStart');
            expect(a.keys()).toContain('marginInlineEnd');
            expect(a.keys()).toContain('marginBlockStart');
            expect(a.keys()).toContain('marginBlockEnd');
            a.forEach((value) => {
                expect(value).toBe('unset');
            });

            const b = handleNegativeMarginRemoval({
                marginLeft: '1px',
                marginRight: '1px',
                marginTop: '1px',
                marginBottom: '1px',
                marginInlineStart: '1px',
                marginInlineEnd: '1px',
                marginBlockStart: '1px',
                marginBlockEnd: '1px',
            });

            b.forEach((value) => {
                expect(value).toBe('1px');
            });
        });
    });

    describe('replaceWhiteSpacePre', () => {
        it('Should replace white-space: pre with white-space: pre-wrap', () => {
            const document = setup();
            document.body.innerHTML = `
                <div id="a" style="white-space: pre;">
                </div>
            `;
            transformStyleAttributes(document.body as unknown as Element);

            const a = document.getElementById('a');
            expect(a?.style.whiteSpace).toBe('pre-wrap');
        });

        // Just in case, we should not modify other white-space values
        it('Should not modify other white-space values than pre', () => {
            const document = setup();
            document.body.innerHTML = `
                <div id="a" style="white-space: normal;"></div>
                <div id="b" style="white-space: nowrap;"></div>
                <div id="c" style="white-space: pre-line;"></div>
            `;
            transformStyleAttributes(document.body as unknown as Element);

            expect(document.getElementById('a')?.style.whiteSpace).toBe('normal');
            expect(document.getElementById('b')?.style.whiteSpace).toBe('nowrap');
            expect(document.getElementById('c')?.style.whiteSpace).toBe('pre-line');
        });
    });
});

describe('startsByANegativeSign', () => {
    it('should return true in these cases', () => {
        const test1 = startsByANegativeSign('-42px');
        expect(test1).toBe(true);

        const test2 = startsByANegativeSign(' -666ex'); // spaces accepted
        expect(test2).toBe(true);

        const test3 = startsByANegativeSign('-0.5pt'); // decimal accepted
        expect(test3).toBe(true);
    });

    it('should return false in these cases', () => {
        const test1 = startsByANegativeSign('100px'); // no negative
        expect(test1).toBe(false);

        const test2 = startsByANegativeSign('--var-name'); // no number
        expect(test2).toBe(false);

        const test3 = startsByANegativeSign('plop -12px'); // -12 not at the beginning
        expect(test3).toBe(false);
    });
});
