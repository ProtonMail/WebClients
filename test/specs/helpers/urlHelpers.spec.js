import { LINK_TYPES } from '../../../src/app/constants';
import { linkToType, stripLinkPrefix, formatLink } from '../../../src/helpers/urlHelpers';

describe('urlHelper', () => {
    describe('link to type', () => {
        it('should find tel type', () => {
            const string = 'tel:0214124';
            expect(linkToType(string))
                .toEqual(LINK_TYPES.PHONE);
        });
        it('should find mail type', () => {
            const string = 'mailto:asd@asd.com';
            expect(linkToType(string))
                .toEqual(LINK_TYPES.EMAIL);
        });
        it('should find http type', () => {
            const string = 'http://asd.com';
            expect(linkToType(string))
                .toEqual(LINK_TYPES.WEB);
        });
        it('should find https type', () => {
            const string = 'https://asd.com';
            expect(linkToType(string))
                .toEqual(LINK_TYPES.WEB);
        });
    });

    describe('strip link prefix', () => {
        it('should strip tel:', () => {
            const string = 'tel:021';
            expect(stripLinkPrefix(string))
                .toEqual('021');
        });
        it('should strip mailto:', () => {
            const string = 'mailto:asd@asd.com';
            expect(stripLinkPrefix(string))
                .toEqual('asd@asd.com');
        });
        it('should not strip http', () => {
            const string = 'http://asd.com';
            expect(stripLinkPrefix(string))
                .toEqual(string);
        });
        it('should not strip https', () => {
            const string = 'https://asd.com';
            expect(stripLinkPrefix(string))
                .toEqual(string);
        });
    });

    describe('format link', () => {
        it('should format link with tel:', () => {
            const string = '021';
            expect(formatLink(string, LINK_TYPES.PHONE))
                .toEqual('tel:021');
        });
        it('should format link with mailto:', () => {
            const string = 'asd@asd.com';
            expect(formatLink(string, LINK_TYPES.EMAIL))
                .toEqual('mailto:asd@asd.com');
        });
        it('should format link with https by default', () => {
            const string = 'asd.com';
            expect(formatLink(string, LINK_TYPES.WEB))
                .toEqual('https://asd.com');
        });
        it('should not format link if prefix exists (tel)', () => {
            const string = 'tel:021';
            expect(formatLink(string, LINK_TYPES.PHONE))
                .toEqual('tel:021');
        });
        it('should not format link if prefix exists (mailto)', () => {
            const string = 'mailto:asd@asd.com';
            expect(formatLink(string, LINK_TYPES.EMAIL))
                .toEqual('mailto:asd@asd.com');
        });
        it('should not format link if prefix exists (http)', () => {
            const string = 'http://asd.com';
            expect(formatLink(string, LINK_TYPES.WEB))
                .toEqual('http://asd.com');
        });
        it('should not format link if prefix exists (https)', () => {
            const string = 'https://asd.com';
            expect(formatLink(string, LINK_TYPES.WEB))
                .toEqual('https://asd.com');
        });
    });
});
