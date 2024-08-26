import { getReturnUrlParameter } from '../../lib/authentication/fork/returnUrl';

describe('returnUrl parameter', () => {
    [
        { name: 'should return undefined for non-leading slash', input: 'non-leading/slash', output: undefined },
        { name: 'should return for leading slash', input: '/leading-slash', output: '/leading-slash' },
        { name: 'should return for leading slash without local id', input: '/u/0/foo', output: '/foo' },
        { name: 'should return with search params', input: '/foo/bar?x=1', output: '/foo/bar?x=1' },
        { name: 'should return with search and hash params', input: '/foo/bar?x=1#y=2', output: '/foo/bar?x=1#y=2' },
        {
            name: 'should return with search and hash params without local id',
            input: '/u/0/foo/bar?x=1#y=2',
            output: '/foo/bar?x=1#y=2',
        },
    ].forEach(({ name, input, output }) => {
        it(name, () => {
            const encoded = encodeURIComponent(input);
            const searchParams = new URLSearchParams(`foo=123&returnUrl=${encoded}&bar=1234`);
            expect(getReturnUrlParameter(searchParams)).toEqual(output);
            expect(searchParams.get('foo')).toEqual('123');
            expect(searchParams.get('bar')).toEqual('1234');
        });
    });
});
