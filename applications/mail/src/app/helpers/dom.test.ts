import { isElement, isHTMLEmpty, matches } from './dom';

describe('isElement', () => {
    it('should be an element', () => {
        const el = document.createElement('p');

        expect(isElement(el)).toBeTruthy();
    });

    it('should not be an element', () => {
        const el = null;

        expect(isElement(el)).toBeFalsy();
    });
});

describe('matches', () => {
    it('should match a selector', () => {
        const link = document.createElement('a');
        link.setAttribute('href', '#link');

        expect(matches(link, '[href^="#"]')).toBeTruthy();
    });
});

describe('isHTMLEmpty', () => {
    it('should be an empty element', () => {
        const html1 = '';
        const html2 = '    ';

        expect(isHTMLEmpty(html1)).toBeTruthy();
        expect(isHTMLEmpty(html2)).toBeTruthy();
    });

    it('should not be an empty element', () => {
        const html1 = 'hello';
        const html2 = '    hello';

        expect(isHTMLEmpty(html1)).toBeFalsy();
        expect(isHTMLEmpty(html2)).toBeFalsy();
    });
});

describe('createErrorHandler', () => {});
