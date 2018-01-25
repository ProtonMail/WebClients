import dateParser from '../../../../src/app/core/factories/vcardDateParser';

describe('vcard date parser', () => {
    const tests = [
        {
            input: '2017-06-05',
            output: { year: '2017', month: '06', day: '05' }
        },
        {
            input: '20170605',
            output: { year: '2017', month: '06', day: '05' }
        },
        {
            input: '1906-05',
            output: { year: '1906', month: '05' }
        },
        {
            input: '190605',
            output: { year: '1906', month: '05' }
        },
        {
            input: '1906',
            output: { year: '1906' }
        },
        {
            input: '--06-05',
            output: { month: '06', day: '05' }
        },
        {
            input: '--0605',
            output: { month: '06', day: '05' }
        },
        {
            input: '--05',
            output: { month: '05' }
        },
        {
            input: '2017-0606',
            output: undefined
        },
        {
            input: '201706-06',
            output: undefined
        },
        {
            input: 'invalid',
            output: undefined
        }
    ];

    function testParserCase({ input, output }) {
        it(`it should parse ${input} to ${JSON.stringify(output)}`, () => {
            expect(dateParser(input)).toEqual(output);
        });
    }

    for (let i = 0; i < tests.length; ++i) {
        testParserCase(tests[i]);
    }
});
