//@ts-check
import customRules from 'eslint-plugin-custom-rules';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        name: 'register-react-plugins',
        plugins: {
            react,
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11yPlugin.flatConfigs.recommended.plugins['jsx-a11y'],
            testingLibrary,
            'custom-rules': customRules,
        },
    },
    { name: 'jsx-a11y', rules: jsxA11yPlugin.flatConfigs.recommended.rules },
    {
        name: 'react-config',
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react/display-name': 'warn',

            'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.tsx'] }],

            'react/jsx-props-no-spreading': 'off',
            'react/prop-types': 'warn',
            'react/require-default-props': 'off',
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',

            'react/forbid-component-props': [
                'warn',
                {
                    forbid: [{ propName: 'data-test-id', message: 'Please use `data-testid` instead' }],
                },
            ],

            'jsx-a11y/anchor-ambiguous-text': 'warn',
            'jsx-a11y/anchor-is-valid': 'warn',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/control-has-associated-label': 'warn',
            'jsx-a11y/interactive-supports-focus': 'warn',
            'jsx-a11y/label-has-associated-control': 'warn',
            'jsx-a11y/media-has-caption': 'warn',
            'jsx-a11y/mouse-events-have-key-events': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn',
            'jsx-a11y/no-interactive-element-to-noninteractive-role': 'warn',
            'jsx-a11y/no-noninteractive-element-interactions': 'warn',
            'jsx-a11y/no-noninteractive-tabindex': 'warn',
            'jsx-a11y/no-aria-hidden-on-focusable': 'warn',
            'jsx-a11y/prefer-tag-over-role': 'warn',
            'jsx-a11y/img-redundant-alt': 'off',
            'jsx-a11y/label-has-for': 'off',
            'jsx-a11y/no-autofocus': 'off',
            'jsx-a11y/no-onchange': 'off',

            'custom-rules/deprecate-spacing-utility-classes': 'warn',
            'custom-rules/deprecate-responsive-utility-classes': 'warn',
            'custom-rules/deprecate-sizing-classes': 'warn',
            'custom-rules/deprecate-classes': 'warn',
            'custom-rules/no-template-in-translator-context': 'error',
            'custom-rules/validate-ttag': 'error',
            'custom-rules/date-formatting-locale': 'warn',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    }
);
