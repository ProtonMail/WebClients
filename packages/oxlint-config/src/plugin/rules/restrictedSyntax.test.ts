import { RuleTester } from 'oxlint/plugins-dev';

import { defaultPropsSelectors } from '../../defaultProps.ts';
import { jsxNamespaceSelectors } from '../../jsxNamespace.ts';
import { propTypesSelectors } from '../../propTypes.ts';
import { refBeforePropsSpreadSelectors } from '../../refBeforePropsSpread.ts';
import { refObjectNullSelectors } from '../../refObjectNull.ts';
import { useReducerTypeArgumentsSelectors } from '../../useReducerTypeArguments.ts';
import { useRefInitialValueSelectors } from '../../useRefInitialValue.ts';
import rule from './restrictedSyntax.ts';

const tsx = { parserOptions: { lang: 'tsx' as const } };

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });

const [globalJsx, reactJsx] = jsxNamespaceSelectors;
const [defaultProps] = defaultPropsSelectors;
const [propTypes] = propTypesSelectors;
const [refBeforePropsSpread] = refBeforePropsSpreadSelectors;
const [useRefInitialValue] = useRefInitialValueSelectors;
const [useReducerTypeArguments] = useReducerTypeArgumentsSelectors;
const [refObjectNull] = refObjectNullSelectors;

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
        {
            code: 'const a = <Input {...rest} ref={ref} />;',
            options: refBeforePropsSpreadSelectors,
            languageOptions: tsx,
        },
        {
            code: 'const A = forwardRef((rest, ref) => <Input ref={ref} {...rest} />);',
            options: refBeforePropsSpreadSelectors,
            languageOptions: tsx,
        },
        {
            code: 'const a = <Input ref={ref} {...getInputProps()} />;',
            options: refBeforePropsSpreadSelectors,
            languageOptions: tsx,
        },
        { code: 'const defaultProps = { a: 1 };', options: defaultPropsSelectors },
        { code: 'class A { static defaultProps = { a: 1 }; }', options: defaultPropsSelectors },
        { code: 'const propTypes = { a: 1 }; Button.types = {};', options: propTypesSelectors },
        { code: 'c("Info").t`Welcome to ${BRAND_NAME}`;', options: [brand, mail] },
        { code: 'c("Info").t`Open ${MAIL_APP_NAME}`;', options: [brand, mail] },
        { code: 'const text = `Proton Mail`;', options: [brand, mail] },
        { code: 'const { a } = config;', options: [destructuredConstant] },
        { code: "store.referenceFor('conversation', id);", options: [emailReference] },
        { code: 'test.only("x", () => {});', options: [focusedTest] },
        { code: 'const anything = 1;' },
        { code: 'let a: RefObject<HTMLElement | null>;', options: refObjectNullSelectors },
        { code: 'let a: React.RefObject<HTMLElement | undefined | null>;', options: refObjectNullSelectors },
        { code: 'let a: RefObject<any>;', options: refObjectNullSelectors },
        { code: 'let a: Ref<HTMLElement>; let b: MutableRefObject<HTMLElement>;', options: refObjectNullSelectors },
        { code: 'const a = useRef<number>(undefined);', options: useRefInitialValueSelectors },
        { code: 'const a = React.useRef(null);', options: useRefInitialValueSelectors },
        { code: 'const a = useRefresh();', options: useRefInitialValueSelectors },
        { code: 'const [a, b] = useReducer(reducer, 0);', options: useReducerTypeArgumentsSelectors },
        { code: 'const [a, b] = React.useReducer(reducer, 0);', options: useReducerTypeArgumentsSelectors },
        { code: "import type { JSX } from 'react'; let a: JSX.Element;", options: jsxNamespaceSelectors },
        {
            code: "import type { JSX, ReactNode } from 'react'; let a: keyof JSX.IntrinsicElements;",
            options: jsxNamespaceSelectors,
        },
        { code: 'let a: Other.JSX.Element;', options: jsxNamespaceSelectors },
        {
            code: "import type { JSX } from 'react'; interface A extends JSX.IntrinsicAttributes {}",
            options: jsxNamespaceSelectors,
        },
    ],
    invalid: [
        {
            code: 'const a = <Input ref={ref} value={v} {...rest} />;',
            options: refBeforePropsSpreadSelectors,
            languageOptions: tsx,
            errors: [{ messageId: 'restrictedSyntax', data: { message: refBeforePropsSpread.message } }],
        },
        {
            code: 'const a = <div ref={ref} {...restProps}></div>;',
            options: refBeforePropsSpreadSelectors,
            languageOptions: tsx,
            errors: [{ messageId: 'restrictedSyntax', data: { message: refBeforePropsSpread.message } }],
        },
        {
            code: 'Button.propTypes = { color: PropTypes.string };',
            options: propTypesSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: propTypes.message } }],
        },
        {
            code: 'class A { static propTypes = { a: 1 }; }',
            options: propTypesSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: propTypes.message } }],
        },
        {
            code: 'Button.defaultProps = { color: "norm" };',
            options: defaultPropsSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: defaultProps.message } }],
        },
        {
            code: 'let a: RefObject<HTMLElement>;',
            options: refObjectNullSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: refObjectNull.message } }],
        },
        {
            code: 'let a: React.RefObject<HTMLElement | undefined>;',
            options: refObjectNullSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: refObjectNull.message } }],
        },
        {
            code: 'let a: RefObject<Map<string, HTMLElement | null>>;',
            options: refObjectNullSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: refObjectNull.message } }],
        },
        {
            code: 'const a = useRef<number>();',
            options: useRefInitialValueSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: useRefInitialValue.message } }],
        },
        {
            code: 'const a = React.useRef();',
            options: useRefInitialValueSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: useRefInitialValue.message } }],
        },
        {
            code: 'const [a, b] = useReducer<Reducer<number, Action>>(reducer, 0);',
            options: useReducerTypeArgumentsSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: useReducerTypeArguments.message } }],
        },
        {
            code: 'const [a, b] = React.useReducer<number, [Action]>(reducer, 0);',
            options: useReducerTypeArgumentsSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: useReducerTypeArguments.message } }],
        },
        {
            code: 'interface A extends JSX.IntrinsicAttributes {}',
            options: jsxNamespaceSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: globalJsx.message } }],
        },
        {
            code: 'class A implements JSX.ElementClass { render() {} }',
            options: jsxNamespaceSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: globalJsx.message } }],
        },
        {
            code: "import React from 'react'; interface A extends React.JSX.IntrinsicAttributes {}",
            options: jsxNamespaceSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: reactJsx.message } }],
        },
        {
            code: 'let a: JSX.Element;',
            options: jsxNamespaceSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: globalJsx.message } }],
        },
        {
            code: "import type { ReactNode } from 'react'; let a: keyof JSX.IntrinsicElements;",
            options: jsxNamespaceSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: globalJsx.message } }],
        },
        {
            code: "import React from 'react'; let a: React.JSX.Element;",
            options: jsxNamespaceSelectors,
            errors: [{ messageId: 'restrictedSyntax', data: { message: reactJsx.message } }],
        },
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
