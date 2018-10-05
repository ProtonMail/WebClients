import { LINK_TYPES } from '../../../src/app/constants';
import { linkToType, stripLinkPrefix, formatLink } from '../../../src/helpers/urlHelpers';


const LINKS_TEST = [
    {
        title: 'tel',
        input: 'tel:0214124',
        output: LINK_TYPES.PHONE
    },
    {
        title: 'mailto',
        input: 'mailto:asd@asd.com',
        output: LINK_TYPES.EMAIL
    },
    {
        title: 'web',
        input: 'http://asd.com',
        output: LINK_TYPES.WEB
    },
    {
        title: 'web',
        input: 'https://asd.com',
        output: LINK_TYPES.WEB
    },
    {
        title: 'default web',
        output: LINK_TYPES.WEB
    }
];

const STRINGS_TEST = [
    {
        title: 'with tel:',
        input: ['021', LINK_TYPES.PHONE],
        output: 'tel:021'
    },
    {
        title: 'with mailto:',
        input: ['asd@asd.com', LINK_TYPES.EMAIL],
        output: 'mailto:asd@asd.com'
    },
    {
        title: 'with https by default',
        input: ['asd.com', LINK_TYPES.WEB],
        output: 'https://asd.com'
    },
    {
        title: 'nothing if prefix already exist: tel',
        input: ['tel:021', LINK_TYPES.PHONE],
        output: 'tel:021'
    },
    {
        title: 'nothing if prefix already exist: mailto',
        input: ['mailto:asd@asd.com', LINK_TYPES.EMAIL],
        output: 'mailto:asd@asd.com'
    },
    {
        title: 'nothing if prefix already exist: http',
        input: ['http://asd.com', LINK_TYPES.WEB],
        output: 'http://asd.com'
    },
    {
        title: 'nothing if prefix already exist: https',
        input: ['https://asd.com', LINK_TYPES.WEB],
        output: 'https://asd.com'
    },
    {
        title: 'nothing if prefix already exist: https 2',
        input: ['https://asd.com'],
        output: 'https://asd.com'
    },
    {
        title: 'format with https by default',
        input: ['asd.com'],
        output: 'https://asd.com'
    }
];


describe('urlHelper', () => {
    describe('link to type', () => {

        LINKS_TEST.forEach(({ input, output, title }) => {
            it(`should identify the type ${title}`, () => {
                expect(linkToType(input)).toBe(output);
            })
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

        STRINGS_TEST.forEach(({ input, output, title }) => {
            it(`should format ${title}`, () => {
                expect(formatLink.apply(null, input)).toBe(output);
            })
        });

    });
});
