import { RuleTester } from 'oxlint/plugins-dev';

import rule from './namingConvention.ts';

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });

const sharedOptions = [
    { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
    { selector: 'function', format: ['camelCase', 'PascalCase'] },
    { selector: 'typeLike', format: ['PascalCase', 'UPPER_CASE'] },
    { selector: 'enum', format: ['PascalCase', 'UPPER_CASE'] },
];

const lumoOptions = [
    {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
    },
    {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
    },
    { selector: 'typeLike', format: ['PascalCase'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
    { selector: 'enum', format: ['PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
];

const formatError = (type: string, name: string, formats: string) => ({
    messageId: 'doesNotMatchFormat',
    data: { type, name, formats },
});

ruleTester.run('naming-convention', rule, {
    valid: [
        { code: 'const fooBar = 1; const FooBar = 2; const FOO_BAR = 3; let i18n = 4;', options: sharedOptions },
        {
            code: 'const { a, b: renamedB, ...rest } = config; const [first, , third = 1] = list;',
            options: sharedOptions,
        },
        {
            code: 'function doThing() {} function Component() {} const handler = function namedHandler() {};',
            options: sharedOptions,
        },
        {
            code: 'class Store {} interface UserProps {} type ApiResponse = string; enum Color {} enum HTTP_STATUS {}',
            options: sharedOptions,
        },
        {
            code: 'function identity<T, TValue>(value: TValue): T { return value as unknown as T; }',
            options: sharedOptions,
        },
        {
            code: 'type Keys<T> = { [key_name in keyof T]: T[key_name] }; type Unwrap<T> = T extends Promise<infer inner_type> ? inner_type : T;',
            options: sharedOptions,
        },
        { code: 'const obj = { snake_case_key: 1 }; foo.snake_case_member = 2;', options: sharedOptions },
        { code: 'const _private = 1; const trailing_ = 2; function _helper() {}', options: lumoOptions },
        { code: 'const snake_case = 1;' },
    ],
    invalid: [
        {
            code: 'const snake_case = 1;',
            options: sharedOptions,
            errors: [formatError('Variable', 'snake_case', 'camelCase, PascalCase, UPPER_CASE')],
        },
        {
            code: 'const { a_b } = config;',
            options: sharedOptions,
            errors: [formatError('Variable', 'a_b', 'camelCase, PascalCase, UPPER_CASE')],
        },
        {
            code: 'const _unused = 1;',
            options: sharedOptions,
            errors: [formatError('Variable', '_unused', 'camelCase, PascalCase, UPPER_CASE')],
        },
        {
            code: 'function do_thing() {}',
            options: sharedOptions,
            errors: [formatError('Function', 'do_thing', 'camelCase, PascalCase')],
        },
        {
            code: 'function DO_THING() {}',
            options: sharedOptions,
            errors: [formatError('Function', 'DO_THING', 'camelCase, PascalCase')],
        },
        {
            code: 'interface userProps {}',
            options: sharedOptions,
            errors: [formatError('Interface', 'userProps', 'PascalCase, UPPER_CASE')],
        },
        {
            code: 'class my_store {}',
            options: sharedOptions,
            errors: [formatError('Class', 'my_store', 'PascalCase, UPPER_CASE')],
        },
        {
            code: 'enum color {}',
            options: sharedOptions,
            errors: [formatError('Enum', 'color', 'PascalCase, UPPER_CASE')],
        },
        {
            code: 'function identity<t>(value: t) { return value; }',
            options: sharedOptions,
            errors: [formatError('Type Parameter', 't', 'PascalCase, UPPER_CASE')],
        },
        {
            code: 'type API_RESPONSE = string;',
            options: lumoOptions,
            errors: [formatError('Type Alias', 'API_RESPONSE', 'PascalCase')],
        },
        {
            code: 'const _snake_case = 1;',
            options: lumoOptions,
            errors: [formatError('Variable', '_snake_case', 'camelCase, PascalCase, UPPER_CASE')],
        },
        {
            code: 'const _x = 1;',
            options: [{ selector: 'variable', format: ['camelCase'], leadingUnderscore: 'forbid' }],
            errors: [
                { messageId: 'unexpectedUnderscore', data: { type: 'Variable', name: '_x', position: 'leading' } },
            ],
        },
    ],
});
