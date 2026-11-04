import { RuleTester } from 'oxlint/plugins-dev';

import rule from './no-playwright-string-tag.js';

const ruleTester = new RuleTester({
    languageOptions: {
        sourceType: 'module',
    },
});

ruleTester.run('no-playwright-string-tag', rule, {
    valid: [
        // Basic correct usage with TEST_TAGS
        `
            test(
                'create a test',
                {
                    tag: TEST_TAGS.TAG,
                },
                () => {}
            )
        `,
    ],
    invalid: [
        // Wrong usage with string
        {
            code: `
                test(
                    'create a test',
                    {
                        tag: '@tag',
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 29,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with string and spaces
        {
            code: `
                test(
                    'create a test',
                    {
                        tag: '  @tag ',
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 29,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with array of just one string
        {
            code: `
                test(
                    'create a test',
                    {
                        tag: ['@tag'],
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 30,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with array of multiple strings
        {
            code: `
                test(
                    'create a test',
                    {
                        tag: ['@tag1', '@tag2'],
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 30,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
                {
                    column: 39,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with mixed array of at least one string
        {
            code: `
                test(
                    'create a test',
                    {
                        tag: [TEST_TAGS.TAG, '@tag2'],
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 45,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with test.describe
        {
            code: `
                test.describe(
                    'create a test',
                    {
                        tag: [TEST_TAGS.TAG, '@tag2'],
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 45,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with test.skip
        {
            code: `
                test.skip(
                    'create a test',
                    {
                        tag: [TEST_TAGS.TAG, '@tag2'],
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 45,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with test.describe.skip
        {
            code: `
                test.describe.skip(
                    'create a test',
                    {
                        tag: [TEST_TAGS.TAG, '@tag2'],
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 45,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        // Wrong usage with test.describe.parallel
        {
            code: `
                test.describe.parallel(
                    'create a test',
                    {
                        tag: '@tag2',
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 29,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
        {
            code: `
                test.describe.parallel(
                    'create a test',
                    {
                        tag: [TEST_TAGS.TAG, '@tag2'],
                    },
                    () => {}
                )
            `,
            errors: [
                {
                    column: 45,
                    message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
                },
            ],
        },
    ],
});
