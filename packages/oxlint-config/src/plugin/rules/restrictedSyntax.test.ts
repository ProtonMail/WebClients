import { RuleTester } from 'oxlint/plugins-dev';

import rule from './restrictedSyntax.ts';

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });

const brand = {
    selector:
        'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton\\b(?!\\s+(Account|Mail|Drive|Calendar|VPN|Verify|Sentinel))/i]',
    message: 'Use `BRAND_NAME` instead to avoid possible translation.',
};
const mail = {
    selector: 'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Mail\\b/i]',
    message: 'Use `MAIL_APP_NAME` instead to avoid possible translation.',
};
const destructuredConstant = {
    selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
    message: 'Do not destructure constants.',
};
const emailReference = {
    selector: "CallExpression[callee.property.name='referenceFor'][arguments.0.value='email']",
    message: 'Use emailReferenceFor.',
};
const focusedTest = {
    selector:
        'CallExpression[callee.object.name=/test/i][callee.property.name="only"]:not([callee.object.name="test"]):not([callee.object.name="describe"])',
    message: 'No focused tests.',
};

ruleTester.run('restricted-syntax', rule, {
    valid: [
        { code: 'c("Info").t`Welcome to ${BRAND_NAME}`;', options: [brand, mail] },
        { code: 'c("Info").t`Open ${MAIL_APP_NAME}`;', options: [brand, mail] },
        { code: 'const text = `Proton Mail`;', options: [brand, mail] },
        { code: 'const { a } = config;', options: [destructuredConstant] },
        { code: "store.referenceFor('conversation', id);", options: [emailReference] },
        { code: 'test.only("x", () => {});', options: [focusedTest] },
        { code: 'const anything = 1;' },
    ],
    invalid: [
        {
            code: 'c("Info").t`Welcome to Proton`;',
            options: [brand, mail],
            errors: [{ messageId: 'restrictedSyntax', data: { message: brand.message } }],
        },
        {
            code: 'c("Info").t`Open Proton Mail`;',
            options: [brand, mail],
            errors: [{ messageId: 'restrictedSyntax', data: { message: mail.message } }],
        },
        {
            code: 'const { a } = APP_CONFIG;',
            options: [destructuredConstant],
            errors: [{ messageId: 'restrictedSyntax', data: { message: destructuredConstant.message } }],
        },
        {
            code: "store.referenceFor('email', id);",
            options: [emailReference],
            errors: [{ messageId: 'restrictedSyntax', data: { message: emailReference.message } }],
        },
        {
            code: 'myTest.only("x", () => {});',
            options: [focusedTest],
            errors: [{ messageId: 'restrictedSyntax', data: { message: focusedTest.message } }],
        },
        {
            code: 'debugger;',
            options: ['DebuggerStatement'],
            errors: [{ messageId: 'restrictedSyntax', data: { message: "Using 'DebuggerStatement' is not allowed." } }],
        },
        {
            code: 'const x = 1;',
            options: [
                { selector: 'Program', message: 'first' },
                { selector: 'Program', message: 'second' },
            ],
            errors: [
                { messageId: 'restrictedSyntax', data: { message: 'first' } },
                { messageId: 'restrictedSyntax', data: { message: 'second' } },
            ],
        },
    ],
});
