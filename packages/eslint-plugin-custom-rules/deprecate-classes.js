/* eslint-env es6 */

// suggestedClassName is optional
const deprecatedClassNames = [
    {
        deprecatedClassName: 'mauto',
        suggestedClassName: 'm-auto',
    },
    {
        deprecatedClassName: 'center',
        suggestedClassName: 'mx-auto',
    },
    {
        deprecatedClassName: 'mxauto',
        suggestedClassName: 'mx-auto',
    },
    {
        deprecatedClassName: 'myauto',
        suggestedClassName: 'my-auto',
    },
    {
        deprecatedClassName: 'mtauto',
        suggestedClassName: 'mt-auto',
    },
    {
        deprecatedClassName: 'mrauto',
        suggestedClassName: 'mr-auto',
    },
    {
        deprecatedClassName: 'mbauto',
        suggestedClassName: 'mb-auto',
    },
    {
        deprecatedClassName: 'mlauto',
        suggestedClassName: 'ml-auto',
    },
    {
        deprecatedClassName: 'wauto',
        suggestedClassName: 'w-auto',
    },
    {
        deprecatedClassName: 'hauto',
        suggestedClassName: 'h-auto',
    },
    {
        deprecatedClassName: 'h0',
        suggestedClassName: 'h-0',
    },
    {
        deprecatedClassName: 'h100',
        suggestedClassName: 'h-full',
    },
    {
        deprecatedClassName: 'opacity-on-hover',
        suggestedClassName: 'group-hover:opacity-100',
    },
    {
        deprecatedClassName: 'opacity-on-hover-container',
        suggestedClassName: 'group-hover-opacity-container',
    },
    {
        deprecatedClassName: 'text-underline-on-hover',
        suggestedClassName: 'hover:text-underline',
    },
    {
        deprecatedClassName: 'opacity-on-focus',
        suggestedClassName: 'opacity-0 focus:opacity-100',
    },
    {
        deprecatedClassName: 'hide-on-hover',
        suggestedClassName: 'group-hover:hidden',
    },
    {
        deprecatedClassName: 'hide-on-hover-container',
        suggestedClassName: 'group-hover-hide-container',
    },
    {
        deprecatedClassName: 'on-hover-opacity-100',
        suggestedClassName: '',
    },
];

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: '',
            url: 'https://design-system.protontech.ch',
        },
    },
    create: (context) => {
        return {
            Literal(node) {
                const { value } = node;
                if (!value || !value.split) {
                    return;
                }

                const classes = new Set(value.split(' '));

                deprecatedClassNames.forEach(({ deprecatedClassName, suggestedClassName }) => {
                    if (!classes.has(deprecatedClassName)) {
                        return;
                    }

                    const messageDeprecated = `"${deprecatedClassName}" has been deprecated.`;
                    const messageSuggested = suggestedClassName && `Please use "${suggestedClassName}" instead.`;
                    const message = `${messageDeprecated} ${messageSuggested}`;

                    context.report({
                        node,
                        message,
                    });
                });
            },
        };
    },
};
