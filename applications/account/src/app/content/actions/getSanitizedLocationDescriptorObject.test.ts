import { getSanitizedLocationDescriptorObject } from './getSanitizedLocationDescriptorObject';

describe('Sanitized location descriptor object', () => {
    for (const { name, input, expectation } of [
        {
            name: 'empty',
            input: { pathname: '/signup', search: '' },
            expectation: { pathname: '/signup', search: '' },
        },
        {
            name: 'combined',
            input: { pathname: '/signup?plan=free', search: '?mode=sps' },
            expectation: { pathname: '/signup', search: '?plan=free&mode=sps' },
        },
        {
            name: 'single pathname',
            input: { pathname: '/signup?plan=free', search: '' },
            expectation: { pathname: '/signup', search: '?plan=free' },
        },
        {
            name: 'single search',
            input: { pathname: '/signup', search: '?mode=sps' },
            expectation: { pathname: '/signup', search: '?mode=sps' },
        },
    ]) {
        it(name, () => {
            expect(getSanitizedLocationDescriptorObject(input)).toEqual(expectation);
        });
    }
});
