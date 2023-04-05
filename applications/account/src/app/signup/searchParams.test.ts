import { SERVICES } from './interfaces';
import { getProductParams } from './searchParams';

describe('search params helper', () => {
    const values = [
        {
            params: 'product=mail',
            pathname: '/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: 'product=calendar',
            pathname: '/signup',
            expectation: { product: SERVICES.calendar, productParam: SERVICES.calendar },
        },
        {
            params: 'product=business',
            pathname: '/signup',
            expectation: { product: undefined, productParam: 'business' },
        },
        {
            params: 'product=generic',
            pathname: '/signup',
            expectation: { product: undefined, productParam: 'generic' },
        },
        {
            params: '',
            pathname: '/mail/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: '',
            pathname: '/mail/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: 'product=calendar',
            pathname: '/mail/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: 'product=foo',
            pathname: '/foo/signup',
            expectation: { product: undefined, productParam: 'generic' },
        },
        {
            params: 'product=foo',
            pathname: '/mail/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: 'product=generic',
            pathname: '/mail/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
    ];
    it.each(values)('$pathname?$params should be $expectation', ({ params, pathname, expectation }) => {
        expect(getProductParams(pathname, new URLSearchParams(params))).toEqual(expectation);
    });
});
