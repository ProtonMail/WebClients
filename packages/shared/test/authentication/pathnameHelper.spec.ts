import { getBasename, getLocalIDFromPathname } from '../../lib/authentication/pathnameHelper';

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
            name: 'should get id with or without starting slash',
            input: 'u/1',
            output: 1,
        },
        {
            name: 'should get from pathname',
            input: '/u/1/my-complicated/path/',
            output: 1,
        },
        {
            name: 'should get id with or without starting slash',
            input: 'u/1',
            output: 1,
        },
        {
            name: 'should get id with or without starting slash',
            input: 'u/123/my-complicated/path',
            output: 123,
        },
        {
            name: 'should not get id if it does not starts with /foo',
            input: '/foo/u/2/my-complicated/path',
            output: undefined,
        },
        {
            name: 'should not get id if it starts with foo',
            input: 'foo/u/2/my-complicated/path',
            output: undefined,
        },
        {
            name: 'should not get id if it starts with a whitespace',
            input: ' /u/2/my-complicated/path',
            output: undefined,
        },
    ].forEach(({ name, input, output }) => {
        it(name, () => {
            expect(getLocalIDFromPathname(input)).toEqual(output);
        });
    });
});
