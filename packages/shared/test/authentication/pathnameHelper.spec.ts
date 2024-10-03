import {
    getBasename,
    getLocalIDFromPathname,
    stripLocalBasenameFromPathname,
} from '../../lib/authentication/pathnameHelper';

describe('basename helper', () => {
    [
        { name: 'should get basename for 0', input: 0, output: '/u/0' },
        { name: 'should get basename for 1', input: 1, output: '/u/1' },
    ].forEach(({ name, input, output }) => {
        it(name, () => {
            expect(getBasename(input)).toEqual(output);
        });
    });
});

describe('local id pathname helper', () => {
    [
        { name: 'should get simple id 0', input: '/u/0', output: 0 },
        {
            name: 'should get simple id 1',
            input: '/u/1',
            output: 1,
        },
        {
            name: 'should get id with or without leading slash',
            input: 'u/1',
            output: 1,
        },
        {
            name: 'should get from pathname',
            input: '/u/1/my-complicated/path/',
            output: 1,
        },
        {
            name: 'should get id with or without leading slash',
            input: 'u/1',
            output: 1,
        },
        {
            name: 'should get id with or without leading slash',
            input: 'u/123/my-complicated/path',
            output: 123,
        },
        {
            name: 'should not get id if it does not lead with /foo',
            input: '/foo/u/2/my-complicated/path',
            output: undefined,
        },
        {
            name: 'should not get id if it leads with foo',
            input: 'foo/u/2/my-complicated/path',
            output: undefined,
        },
        {
            name: 'should not get id if it leads with a whitespace',
            input: ' /u/2/my-complicated/path',
            output: undefined,
        },
    ].forEach(({ name, input, output }) => {
        it(name, () => {
            expect(getLocalIDFromPathname(input)).toEqual(output);
        });
    });
});

describe('strip local basename', () => {
    describe('strip valid local basename', () => {
        const name = 'should strip invalid local basename';
        [
            { input: 'u/0', output: '/' },
            { input: 'u/0/foo', output: '/foo' },
            { input: '/u/0', output: '/' },
            { input: '/u/0/u/1', output: '/' },
            { input: '/u/0/u/1/asd', output: '/asd' },
            { input: '/u/0/', output: '/' },
            { input: '/u/1000/asd', output: '/asd' },
            { input: '/u/9/asd/', output: '/asd/' },
            { input: '/u/2/asd/foo', output: '/asd/foo' },
            { input: '/u/3/asd', output: '/asd' },
            { input: '/u/5021/asd/', output: '/asd/' },
            { input: '/u/10000021/asd/foo', output: '/asd/foo' },
            { input: '//u/0', output: '/' },
            { input: '//u/0/foo', output: '/foo' },
            { input: '//u/0/foo?x=y', output: '/foo?x=y' },
            { input: '//u/0//foo?x=y', output: '/foo?x=y' },
            { input: '/u/0/foo?u=0&x=y', output: '/foo?u=0&x=y' },
            { input: '/u/0///foo?u=0&x=y', output: '/foo?u=0&x=y' },
            { input: '/u/0/u/1/foo?u=0&x=y', output: '/foo?u=0&x=y' },
            { input: '/u/0/u/1/foo?u=0&x=y', output: '/foo?u=0&x=y' },
            { input: '/u/0/u/foo/foo?u=0&x=y', output: '/foo/foo?u=0&x=y' },
            { input: '/u/0/u///foo/foo?u=0&x=y', output: '/foo/foo?u=0&x=y' },
        ].forEach(({ input, output }) => {
            it(`${name} - ${input} - ${output}`, () => {
                expect(stripLocalBasenameFromPathname(input)).toEqual(output);
            });
        });
    });

    describe('strip invalid local basename', () => {
        const name = 'should strip invalid local basename';
        [
            { input: '', output: '/' },
            { input: 'foo', output: '/foo' },
            { input: '/foo', output: '/foo' },
            { input: '/foo/bar', output: '/foo/bar' },
            { input: '/foo/bar/', output: '/foo/bar/' },
            { input: 'u', output: '/' },
            { input: 'u/', output: '/' },
            { input: 'u//', output: '/' },
            { input: 'u/foo', output: '/foo' },
            { input: '/u', output: '/' },
            { input: '//u', output: '/' },
            { input: '///u', output: '/' },
            { input: '///a', output: '/a' },
            { input: '///u/foo', output: '/foo' },
            { input: '///u/u', output: '/' },
            { input: '///u/u/', output: '/' },
            { input: '///u/u/1', output: '/' },
            { input: '/ua/foo', output: '/ua/foo' },
            { input: '/u/foo', output: '/foo' },
            { input: '/u/1a2', output: '/1a2' },
            { input: '/u/1a2/', output: '/1a2/' },
            { input: '/u/1e2/', output: '/1e2/' },
            { input: '/u/10000021/asd/foo', output: '/asd/foo' },
            { input: '/u/100000219/asd/foo', output: '/100000219/asd/foo' },
            { input: '/u/foo/', output: '/foo/' },
            { input: '/u/foo/asd', output: '/foo/asd' },
            { input: '/u//u/foo/', output: '/foo/' },
            { input: '/u/u/foo/', output: '/foo/' },
            { input: '/u///u//foo/', output: '/foo/' },
            { input: '/u///u/foo/', output: '/foo/' },
            { input: '/u///u/foo', output: '/foo' },
            { input: '/u/3/foo', output: '/foo' },
            { input: '/u///3/foo', output: '/foo' },
            { input: '/u///ua/foo', output: '/ua/foo' },
            { input: '/u/0/u///3/foo?u=0&x=y', output: '/foo?u=0&x=y' },
            { input: '///u///0///u///3/foo?u=0&x=y', output: '/foo?u=0&x=y' },
        ].forEach(({ input, output }) => {
            it(`${name} - ${input} - ${output}`, () => {
                expect(stripLocalBasenameFromPathname(input)).toEqual(output);
            });
        });
    });
});
