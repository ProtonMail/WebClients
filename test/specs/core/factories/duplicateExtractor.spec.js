import duplicateExtractor from '../../../../src/helpers/duplicateExtractor';

describe('duplicateExtractor', () => {
    const tests = [
        {
            input: [{ duplicate: 'foo', object: 1 }, { duplicate: 'foo', object: 2 }],
            output: { foo: [1, 2] }
        },
        {
            input: [{ duplicate: 'foo', object: 1 }, { duplicate: 'foo', object: 1 }],
            output: {}
        },
        {
            input: [
                {
                    duplicate: 'foo',
                    object: 1
                },
                {
                    duplicate: 'bar',
                    object: 2
                },
                {
                    duplicate: 'xyz',
                    object: 3
                },
                {
                    duplicate: 'zyx',
                    object: 3
                },
                {
                    duplicate: 'zyx',
                    object: 4
                }
            ],
            output: { zyx: [3, 4] }
        },
        {
            input: [
                {
                    duplicate: 'foo',
                    object: 1
                },
                {
                    duplicate: 'bar',
                    object: 2
                },
                {
                    duplicate: 'xyz',
                    object: 3
                },
                {
                    duplicate: 'zyx',
                    object: 3
                },
                {
                    duplicate: 'zyx',
                    object: 4
                },
                {
                    duplicate: 'zyx',
                    object: 1
                },
                {
                    duplicate: 'foo',
                    object: 5
                },
                {
                    duplicate: 'foo',
                    object: 2
                },
                {
                    duplicate: 'foo',
                    object: 6
                }
            ],
            output: { zyx: [3, 4, 1], foo: [5, 2, 6] }
        },
        {
            input: [
                {
                    duplicate: 'foo',
                    object: 1
                },
                {
                    duplicate: 'bar',
                    object: 1
                },
                {
                    duplicate: 'foo',
                    object: 2
                },
                {
                    duplicate: 'bar',
                    object: 2
                },
                {
                    duplicate: 'bar',
                    object: 3
                },
                {
                    duplicate: 'bar',
                    object: 4
                }
            ],
            output: { foo: [1, 2], bar: [3, 4] }
        },
        {
            input: [
                {
                    duplicate: 'foo',
                    object: 1
                },
                {
                    duplicate: 'foo',
                    object: 2
                },
                {
                    duplicate: 'bar',
                    object: 2
                },
                {
                    duplicate: 'bar',
                    object: 2
                },
                {
                    duplicate: 'foo',
                    object: 3
                },
                {
                    duplicate: 'foo',
                    object: 1
                }
            ],
            output: { foo: [1, 2, 3] }
        },
        {
            input: [{ duplicate: 'foo', object: 1 }, { duplicate: 'foo', object: 2 }, {
                duplicate: 'bar',
                object: 1
            }, { duplicate: 'bar', object: 2 }],
            output: { foo: [1, 2] }
        }
    ];

    function testCase({ input, output }) {
        it(`it should extract ${JSON.stringify(input)} to ${JSON.stringify(output)}`, () => {
            expect(duplicateExtractor({
                items: input,
                duplicateKey: 'duplicate',
                uniqueKey: 'object',
                objectKey: 'object'
            })).toEqual(output);
        });
    }

    for (let i = 0; i < tests.length; ++i) {
        testCase(tests[i]);
    }

    it('it should extract objects as well', () => {
        const A = { name: 'a' };
        const B = { name: 'b' };
        const C = { name: 'a' };
        const D = { name: 'b' };
        const E = { name: 'a' };
        const F = { name: 'c' };
        const items = [A, B, C, D, E, F].map((item, i) => ({ duplicate: item.name, object: item, unique: i }));
        expect(duplicateExtractor({
            items,
            duplicateKey: 'duplicate',
            uniqueKey: 'unique',
            objectKey: 'object'
        })).toEqual({ a: [A, C, E], b: [B, D] });
    });
});
