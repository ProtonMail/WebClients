import factory from '../../../../src/app/commons/services/url';
import CONFIG from '../../../../src/app/config';

const mockService = {
    test: () => ({})
};

const toOutput = (output = 'LOL', scope = 'url', prefix = '') => {

    const list = Array.isArray(output) ? output : [output].filter((key) => key !== 'LOL');
    return [`${prefix}/${scope}`.trim(), ...list].join('/');
};

const testSuite = (scope, prefix) => {
    return [
        {
            name: 'No args',
            input: [],
            output: toOutput(undefined, scope, prefix)
        },
        {
            name: 'Empty args',
            input: [null, undefined, ''],
            output: toOutput(undefined, scope, prefix)
        },
        {
            name: 'Empty args around 1',
            input: [null, undefined, 1, ''],
            output: toOutput(1, scope, prefix)
        },
        {
            name: 'Empty args around 0',
            input: [null, undefined, 0, ''],
            output: toOutput(0, scope, prefix)
        },
        {
            name: 'One arg as number',
            input: [1],
            output: toOutput(1, scope, prefix)
        },
        {
            name: 'Many args as number',
            input: [1,2,3],
            output: toOutput([1,2,3], scope, prefix)
        },
        {
            name: 'Many mixed args',
            input: [1,'0',3, undefined, null, '', 'monique'],
            output: toOutput([1,'0',3, 'monique'], scope, prefix)
        }
    ]
}

describe('[commons/services] ~ url', () => {
    let service;

    beforeEach(() => {
        spyOn(mockService, 'test').and.callThrough();
        service = factory(mockService);
    });

    it('should return the app URL', () => {
        expect(service.get()).toBe(CONFIG.apiUrl);
    });

    it('should return the host URL', () => {
        expect(service.host()).toMatch(/\w+\.protonmail\.com/);
    });

    testSuite().forEach(({ name, input, output }) => {
        it(`should format the url for: ${name}`, () => {
            expect(service.make('url')(...input)).toBe(output);
        });
    });

    describe('Custom prefix', () => {
        testSuite('jeanne', CONFIG.apiUrl).forEach(({ name, input, output }) => {

            it(`should format the url for: ${name}`, () => {
                const requestURL = service.build('jeanne');
                expect(requestURL(...input)).toBe(output);
            });
        });
    })
});
