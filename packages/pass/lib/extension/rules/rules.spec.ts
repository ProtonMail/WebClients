import { compileRules, expandArrayPattern, matchRules, matchSegments, parseRules, validateRules } from './rules';
import { RULES_V1_MOCK } from './v1/mock';
import RULES_V1_PROD from './v1/rules.json';
import { RULES_V2_MOCK } from './v2/mock';
import RULES_V2_PROD from './v2/rules.json';

const toDict = (obj: object): object => {
    const replace = (_: string, value: any) => (value instanceof Map ? Object.fromEntries(value) : value);
    return JSON.parse(JSON.stringify(obj, replace));
};

describe('Validation', () => {
    test('returns `true` if valid object for current supported version', () => {
        expect(validateRules(RULES_V1_MOCK)).toBe(true);
        expect(validateRules(RULES_V2_MOCK)).toBe(true);
    });

    test('returns `false` if version is not supported', () => {
        expect(validateRules({ ...RULES_V1_MOCK, version: '42' })).toBe(false);
        expect(validateRules({ ...RULES_V2_MOCK, version: '42' })).toBe(false);
    });

    test('should return `null` on invalid data', () => {
        expect(validateRules({})).toBe(false);
        expect(validateRules(null)).toBe(false);
        expect(validateRules(undefined)).toBe(false);
    });
});

describe('Parser', () => {
    test('returns `null` if parsing fails', () => {
        expect(parseRules(null)).toEqual(null);
        expect(parseRules('{}')).toEqual(null);
        expect(parseRules('not-json')).toEqual(null);
        expect(parseRules(JSON.stringify({ ...RULES_V1_MOCK, version: '42' }))).toEqual(null);
        expect(parseRules(JSON.stringify({ ...RULES_V2_MOCK, version: '42' }))).toEqual(null);
    });

    test('should support v1', () => {
        expect(parseRules(JSON.stringify(RULES_V1_MOCK))).toEqual(RULES_V1_MOCK);
    });

    test('should support v2', () => {
        expect(parseRules(JSON.stringify(RULES_V2_MOCK))).toEqual(RULES_V2_MOCK);
    });
});

describe('Compiler', () => {
    describe('`expandArrayPattern`', () => {
        test('returns single pattern when no array syntax', () => {
            expect(expandArrayPattern('*.amazon.com')).toEqual(['*.amazon.com']);
            expect(expandArrayPattern('api.google.com/login')).toEqual(['api.google.com/login']);
        });

        test('expands single array pattern', () => {
            expect(expandArrayPattern('*.{amazon,google}.com')).toEqual(['*.amazon.com', '*.google.com']);
        });

        test('expands multiple array patterns', () => {
            expect(expandArrayPattern('*.{amazon,google}.{com,co.uk}')).toEqual([
                '*.amazon.com',
                '*.amazon.co.uk',
                '*.google.com',
                '*.google.co.uk',
            ]);
        });

        test('expands array patterns with paths', () => {
            expect(expandArrayPattern('{api,www}.amazon.com/login')).toEqual([
                'api.amazon.com/login',
                'www.amazon.com/login',
            ]);
        });

        test('handles complex nested expansions', () => {
            expect(expandArrayPattern('{api,www}.{amazon,google}.{com,de}/login')).toEqual([
                'api.amazon.com/login',
                'api.amazon.de/login',
                'api.google.com/login',
                'api.google.de/login',
                'www.amazon.com/login',
                'www.amazon.de/login',
                'www.google.com/login',
                'www.google.de/login',
            ]);
        });

        test('handles `i18n-tld` flag', () => {
            expect(expandArrayPattern('www.amazon.{i18n-tld}/login')).toEqual([
                'www.amazon.ae/login',
                'www.amazon.be/login',
                'www.amazon.ca/login',
                'www.amazon.cn/login',
                'www.amazon.co.jp/login',
                'www.amazon.co.uk/login',
                'www.amazon.co.za/login',
                'www.amazon.com.au/login',
                'www.amazon.com.be/login',
                'www.amazon.com.br/login',
                'www.amazon.com.mx/login',
                'www.amazon.com.sa/login',
                'www.amazon.com.tr/login',
                'www.amazon.com/login',
                'www.amazon.de/login',
                'www.amazon.es/login',
                'www.amazon.fr/login',
                'www.amazon.ie/login',
                'www.amazon.in/login',
                'www.amazon.it/login',
                'www.amazon.nl/login',
                'www.amazon.pl/login',
                'www.amazon.sa/login',
                'www.amazon.se/login',
                'www.amazon.sg/login',
            ]);
        });
    });

    describe('`compileRules`', () => {
        test('compiles simple rules without arrays', () => {
            const compiled = compileRules({
                version: '2',
                rules: {
                    '*.amazon.com': {},
                    'api.google.com': {},
                },
            });

            const expected = {
                version: '2',
                nodes: {
                    '*': { nodes: { amazon: { nodes: { com: { rule: {} } } } } },
                    api: { nodes: { google: { nodes: { com: { rule: {} } } } } },
                },
            };

            expect(toDict(compiled)).toEqual(expected);
        });

        test('compiles rules with array expansion', () => {
            const compiled = compileRules({
                version: '2',
                rules: { '*.{amazon,google}.com': {} },
            });

            const expected = {
                version: '2',
                nodes: {
                    '*': {
                        nodes: {
                            amazon: { nodes: { com: { rule: {} } } },
                            google: { nodes: { com: { rule: {} } } },
                        },
                    },
                },
            };

            expect(toDict(compiled)).toEqual(expected);
        });

        test('compiles rules with paths', () => {
            const compiled = compileRules({
                version: '2',
                rules: {
                    'api.amazon.com/login/v2': {},
                    'api.amazon.{com,co.uk}': {},
                },
            });

            const expected = {
                version: '2',
                nodes: {
                    api: {
                        nodes: {
                            amazon: {
                                nodes: {
                                    com: { nodes: { '/login/v2': { rule: {} } }, rule: {} },
                                    co: { nodes: { uk: { rule: {} } } },
                                },
                            },
                        },
                    },
                },
            };

            expect(toDict(compiled)).toEqual(expected);
        });

        test('handles multiple rules with same expanded patterns', () => {
            const compiled = compileRules({
                version: '2',
                rules: {
                    '*.amazon.{com,co.uk}': {},
                    'api.amazon.com': {},
                },
            });

            const expected = {
                version: '2',
                nodes: {
                    '*': {
                        nodes: {
                            amazon: {
                                nodes: {
                                    com: { rule: {} },
                                    co: { nodes: { uk: { rule: {} } } },
                                },
                            },
                        },
                    },
                    api: {
                        nodes: {
                            amazon: {
                                nodes: {
                                    com: { rule: {} },
                                },
                            },
                        },
                    },
                },
            };

            expect(toDict(compiled)).toEqual(expected);
        });
    });

    describe('Sanity checks', () => {
        test('Compiles production rules under 20ms', async () => {
            const start = performance.now();
            const result = compileRules(RULES_V1_PROD as any);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(20);
            expect(result.version).toEqual('1');
        });

        test('Compiles production experimental rules under 20ms', async () => {
            const start = performance.now();
            const result = compileRules(RULES_V2_PROD as any);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(20);
            expect(result.version).toEqual('2');
        });
    });
});

describe('Matchers', () => {
    describe('`matchSegments`', () => {
        const compiledV2 = compileRules(RULES_V2_MOCK);
        const compiledV1 = compileRules(RULES_V1_MOCK);

        test('returns node itself when no segments', () => {
            const node = { rule: { exclude: ['test'] } };
            expect(matchSegments(node, [])).toEqual([node]);
        });

        test('returns node with path matches', () => {
            const node = {
                rule: { exclude: ['test'] },
                nodes: new Map([['/path', { rule: { exclude: ['sidebar'] } }]]),
            };
            expect(matchSegments(node, [], '/path')).toEqual([node, { rule: { exclude: ['sidebar'] } }]);
        });

        test('matches exact segments from compiled v2 rules', () => {
            const exampleNode = compiledV2.nodes!.get('example');
            const comNode = exampleNode!.nodes!.get('com');
            expect(matchSegments(compiledV2, ['example', 'com'])).toEqual([comNode]);
        });

        test('matches exact segments from compiled v1 rules', () => {
            const exampleNode = compiledV1.nodes!.get('example');
            const comNode = exampleNode!.nodes!.get('com');
            expect(matchSegments(compiledV1, ['example', 'com'])).toEqual([comNode]);
        });

        test('matches with path segments', () => {
            const exampleNode = compiledV2.nodes!.get('example');
            const comNode = exampleNode!.nodes!.get('com');
            const pathNode = comNode!.nodes!.get('/path');
            expect(matchSegments(compiledV2, ['example', 'com'], '/path')).toEqual([comNode, pathNode]);
        });

        test('should not match partially', () => {
            expect(matchSegments(compiledV2, ['example', 'com', 'fr'])).toEqual([]);
            expect(matchSegments(compiledV2, ['example', 'com', 'sub', 'fr'], '/path')).toEqual([]);
        });
    });

    describe('`matchRules`', () => {
        test('returns `null` for unsupported version', () => {
            const rules = { version: '3', nodes: new Map() } as any;
            const url = new URL('https://example.com');
            expect(matchRules(rules, url)).toBe(null);
        });

        test('returns `null` when no matches', () => {
            const compiled = compileRules(RULES_V2_MOCK);
            expect(matchRules(compiled, new URL('https://other.com'))).toEqual(null);
        });

        test('matches Rules V1', () => {
            const compiled = compileRules(RULES_V1_MOCK);

            expect(matchRules(compiled, new URL('https://example.com'))).toEqual({
                version: '1',
                exclude: ['rule > host > 1', 'rule > host > 2'],
            });

            expect(matchRules(compiled, new URL('https://example.com/path'))).toEqual({
                version: '1',
                exclude: ['rule > host > 1', 'rule > host > 2', 'rule > path > 1'],
            });

            expect(matchRules(compiled, new URL('https://proton.me/path'))).toEqual({
                version: '1',
                exclude: ['rule > path > 2'],
            });

            expect(matchRules(compiled, new URL('https://example.com.subdomain.fr'))).toEqual(null);
            expect(matchRules(compiled, new URL('https://example.com.fr/path'))).toEqual(null);
            expect(matchRules(compiled, new URL('http://example.com.fr/path'))).toEqual(null);
        });

        test('matches Rules V2', () => {
            const compiled = compileRules(RULES_V2_MOCK);

            expect(matchRules(compiled, new URL('https://example.com'))).toEqual({
                version: '2',
                exclude: ['header', 'footer'],
                include: [
                    {
                        selector: ['form[data-test="login"]'],
                        formType: 'login',
                        fields: [{ selector: ['input[type="email"]'], fieldType: 'email' }],
                    },
                ],
            });

            expect(matchRules(compiled, new URL('https://example.com/path'))).toEqual({
                version: '2',
                exclude: ['header', 'footer', 'sidebar'],
                include: [
                    {
                        selector: ['form[data-test="login"]'],
                        formType: 'login',
                        fields: [{ selector: ['input[type="email"]'], fieldType: 'email' }],
                    },
                ],
            });

            expect(matchRules(compiled, new URL('https://proton.me/path'))).toEqual({
                version: '2',
                include: [{ selector: ['form'], formType: 'register' }],
            });

            expect(matchRules(compiled, new URL('https://example.com.subdomain.fr'))).toEqual(null);
            expect(matchRules(compiled, new URL('https://example.com.fr/path'))).toEqual(null);
            expect(matchRules(compiled, new URL('http://example.com.fr/path'))).toEqual(null);
        });

        test('handles wildcard patterns', () => {
            const compiled = compileRules({
                version: '2',
                rules: { '*.example.com': { exclude: ['wildcard'] } },
            });

            expect(matchRules(compiled, new URL('https://www.example.com'))).toEqual({
                version: '2',
                exclude: ['wildcard'],
            });

            expect(matchRules(compiled, new URL('https://api.example.com'))).toEqual({
                version: '2',
                exclude: ['wildcard'],
            });
        });

        test('merges rules with wildcard and exact matches', () => {
            const compiled = compileRules({
                version: '2',
                rules: {
                    '*.example.com': { exclude: ['wildcard'] },
                    'api.example.com': { exclude: ['exact'] },
                },
            });

            expect(matchRules(compiled, new URL('https://api.example.com'))).toEqual({
                version: '2',
                exclude: ['exact', 'wildcard'],
            });
        });
    });
});
