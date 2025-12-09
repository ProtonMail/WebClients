import { SERVICES, getProductParams } from './searchParams';

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
            params: 'plan=bundlepro2024',
            pathname: '/business/signup',
            expectation: { product: SERVICES.mail, productParam: 'business' },
        },
        {
            params: 'plan=mailbiz2024',
            pathname: '/business/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: 'plan=mailpro2022',
            pathname: '/business/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
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
        {
            params: 'product=mail',
            pathname: '/foo/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: 'product=foo',
            pathname: '/mail/signup',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
        {
            params: 'product=foo',
            pathname: '/foo/signup',
            expectation: { product: undefined, productParam: 'generic' },
        },
        {
            params: 'app=proton-pass-extension',
            pathname: '/authorize',
            expectation: { product: SERVICES.pass, productParam: SERVICES.pass },
        },
        {
            params: 'app=proton-mail',
            pathname: '/authorize',
            expectation: { product: SERVICES.mail, productParam: SERVICES.mail },
        },
    ];
    it.each(values)('$pathname?$params should be $expectation', ({ params, pathname, expectation }) => {
        expect(getProductParams(pathname, new URLSearchParams(params))).toEqual(expectation);
    });
});
