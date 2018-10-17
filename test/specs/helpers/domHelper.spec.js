import { isHTML, escapeSrc, unescapeSrc, inlineCss } from '../../../src/helpers/domHelper';

describe('isHTML', () => {
    [
        {
            name: 'an empty string',
            input: '',
            output: { isHtml: false, isWrapped: false }
        },
        {
            name: 'a simple string',
            input: 'panda',
            output: { isHtml: false, isWrapped: false }
        },
        {
            name: 'a string with <',
            input: 'panda < tiger',
            output: { isHtml: false, isWrapped: false }
        },
        {
            name: 'a string with end block',
            input: 'panda </div>',
            output: { isHtml: false, isWrapped: false }
        },
        {
            name: 'a string with start block',
            input: 'panda <div> tiger',
            output: { isHtml: true, isWrapped: false }
        },
        {
            name: 'a wrapped string',
            input: '<div>panda</div>',
            output: { isHtml: true, isWrapped: true }
        },
        {
            name: 'a string with link',
            input: 'panda <a>link</a>',
            output: { isHtml: true, isWrapped: false }
        }
    ].forEach(({ input, output, name }) => {
        it(`should ${output ? '' : 'not '}detect HTML content in ${name}`, () => {
            expect(isHTML(input))
                .toEqual(output);
        });
    });
});

describe('inline css and remove classes', () => {
    const getHtml = ({ style = '', body }) => `<html><head>${style}</head><body>${body}</body></html>`;

    [
        {
            name: 'strip main div',
            input: getHtml({
                style: '<style>.bar { font-color: red }</style>',
                body: '<div class="bar">asd</div>'
            }),
            output: getHtml({
                body: '<div style="font-color: red;">asd</div>'
            })
        },
        {
            name: 'strip child',
            input: getHtml({
                style: '<style>.foo { font-color: red } .bar { font-color: yellow; }</style>',
                body: '<div class="foo"><b class="bar">asd</b></div>'
            }),
            output: getHtml({
                body: '<div style="font-color: red;"><b style="font-color: yellow;">asd</b></div>'
            })
        }
    ].forEach(({ input, output, name }) => {
        it(`should ${name}`, () => {
            expect(inlineCss(input))
                .toEqual(output);
        });
    });
});

describe('escape', () => {
    it('should escape src', () => {
        expect(escapeSrc('<img src="woot">'))
            .toEqual('<img data-src="woot">');
    });

    it('should not double escape', () => {
        expect(escapeSrc('<img data-src="woot">'))
            .toEqual('<img data-src="woot">');
    });

    it('should not escape proton-src', () => {
        expect(escapeSrc('<img proton-src="woot">'))
            .toEqual('<img proton-src="woot">');
    });

    it('should unescape', () => {
        expect(unescapeSrc('<img data-src="woot">'))
            .toEqual('<img src="woot">');
    });

    it('should not unescape proton-src', () => {
        expect(unescapeSrc('<img proton-src="woot">'))
            .toEqual('<img proton-src="woot">');
    });
});
