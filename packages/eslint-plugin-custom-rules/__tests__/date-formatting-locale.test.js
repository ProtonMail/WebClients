import rule from '../date-formatting-locale';

/* eslint-env es6 */

const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});

ruleTester.run('date-formatting-locale', rule, {
    valid: [
        // Basic correct usage with locale
        `
            import { format } from 'date-fns';
            format(new Date(), 'PP', { locale: enUS });
        `,
        // With more complex date expression
        `
            import { format } from 'date-fns';
            format(new Date(Date.now()), 'PP', { locale: enUS });
        `,
        // With variable as date
        `
            import { format } from 'date-fns';
            const date = new Date();
            format(date, 'PP', { locale: enUS });
        `,
        // With different format string
        `
            import { format } from 'date-fns';
            format(date, 'yyyy-MM-dd', { locale: enUS });
        `,
        // Different format function (not from date-fns)
        `
            import { format } from 'other-library';
            format(date, 'PP');
        `,
        // Format from different library with same name
        `
            import { format as otherFormat } from 'date-fns';
            const format = (date, pattern) => pattern;
            format(date, 'PP');
        `,
        // With additional options
        `
            import { format } from 'date-fns';
            format(date, 'PP', { locale: enUS, weekStartsOn: 1 });
        `,
        // With variable as third argument
        `
            import { format } from 'date-fns';
            const options = getSomeOptions();
            format(date, 'PP', options);
        `,
        // With function call as third argument
        `
            import { format } from 'date-fns';
            format(date, 'PP', getLocaleOptions());
        `,
    ],
    invalid: [
        // Missing locale parameter
        {
            code: `
                import { format } from 'date-fns';
                format(new Date(), 'PP');
            `,
            errors: [
                {
                    message: 'The format function should include a locale parameter as the third argument',
                    type: 'CallExpression',
                },
            ],
        },
        // Missing locale with variable date
        {
            code: `
                import { format } from 'date-fns';
                const date = new Date();
                format(date, 'PP');
            `,
            errors: [
                {
                    message: 'The format function should include a locale parameter as the third argument',
                    type: 'CallExpression',
                },
            ],
        },
        // Missing locale with different format string
        {
            code: `
                import { format } from 'date-fns';
                format(date, 'yyyy-MM-dd');
            `,
            errors: [
                {
                    message: 'The format function should include a locale parameter as the third argument',
                    type: 'CallExpression',
                },
            ],
        },
        // Multiple format calls with missing locale
        {
            code: `
                import { format } from 'date-fns';
                format(date1, 'PP');
                format(date2, 'PP', { locale: enUS });
                format(date3, 'PP');
            `,
            errors: [
                {
                    message: 'The format function should include a locale parameter as the third argument',
                    type: 'CallExpression',
                },
                {
                    message: 'The format function should include a locale parameter as the third argument',
                    type: 'CallExpression',
                },
            ],
        },
    ],
});
