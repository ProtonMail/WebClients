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
    {
        deprecatedClassName: 'flex-justify-start',
        suggestedClassName: 'justify-start',
    },
    {
        deprecatedClassName: 'flex-justify-center',
        suggestedClassName: 'justify-center',
    },
    {
        deprecatedClassName: 'flex-justify-end',
        suggestedClassName: 'justify-end',
    },
    {
        deprecatedClassName: 'flex-justify-space-between',
        suggestedClassName: 'justify-space-between',
    },
    {
        deprecatedClassName: 'flex-justify-space-around',
        suggestedClassName: 'justify-space-around',
    },
    {
        deprecatedClassName: 'flex-justify-space-evenly',
        suggestedClassName: 'justify-space-evenly',
    },
    {
        deprecatedClassName: 'flex-align-items-start',
        suggestedClassName: 'items-start',
    },
    {
        deprecatedClassName: 'flex-align-items-center',
        suggestedClassName: 'items-center',
    },
    {
        deprecatedClassName: 'flex-align-items-end',
        suggestedClassName: 'items-end',
    },
    {
        deprecatedClassName: 'flex-align-items-baseline',
        suggestedClassName: 'items-baseline',
    },
    {
        deprecatedClassName: 'flex-align-items-stretch',
        suggestedClassName: 'items-stretch',
    },
    {
        deprecatedClassName: 'flex-align-items-inherit',
        suggestedClassName: 'items-inherit',
    },
    {
        deprecatedClassName: 'flex-align-self-start',
        suggestedClassName: 'self-start',
    },
    {
        deprecatedClassName: 'flex-align-self-center',
        suggestedClassName: 'self-center',
    },
    {
        deprecatedClassName: 'flex-align-self-end',
        suggestedClassName: 'self-end',
    },
    {
        deprecatedClassName: 'flex-align-self-baseline',
        suggestedClassName: 'self-baseline',
    },
    {
        deprecatedClassName: 'flex-align-self-stretch',
        suggestedClassName: 'self-stretch',
    },
    {
        deprecatedClassName: 'flex-align-self-inherit',
        suggestedClassName: 'self-inherit',
    },
    {
        deprecatedClassName: 'flex-item-fluid-auto',
        suggestedClassName: 'flex-auto',
    },
    {
        deprecatedClassName: 'flex-item-fluid',
        suggestedClassName: 'flex-1',
    },
    {
        deprecatedClassName: 'flex-item-noflex',
        suggestedClassName: 'flex-none',
    },
    {
        deprecatedClassName: 'flex-item-grow',
        suggestedClassName: 'grow',
    },
    {
        deprecatedClassName: 'flex-item-grow-2',
        suggestedClassName: 'grow-2',
    },
    {
        deprecatedClassName: 'flex-item-nogrow',
        suggestedClassName: 'grow-0',
    },
    {
        deprecatedClassName: 'flex-item-grow-custom',
        suggestedClassName: 'grow-custom',
    },
    {
        deprecatedClassName: 'flex-item-shrink',
        suggestedClassName: 'shrink',
    },
    {
        deprecatedClassName: 'flex-item-noshrink',
        suggestedClassName: 'shrink-0',
    },
    {
        deprecatedClassName: 'flex-flex-children',
        suggestedClassName: 'flex and *:flex',
    },
    {
        deprecatedClassName: 'flex-items-center',
        suggestedClassName: '*:items-center',
    },
    {
        deprecatedClassName: 'inline-flex-vcenter',
        suggestedClassName: 'inline-flex and *:self-center',
    },
    {
        deprecatedClassName: 'flex-item-centered-vert',
        suggestedClassName: 'self-center and my-auto',
    },
    {
        deprecatedClassName: 'flex-no-min-children',
        suggestedClassName: 'flex and *:min-size-auto',
    },
    {
        deprecatedClassName: 'flex-no-wrap',
        suggestedClassName: 'flex-nowrap',
    },
    {
        deprecatedClassName: 'hidden-empty',
        suggestedClassName: 'empty:hidden',
    },
    {
        deprecatedClassName: 'scroll-if-needed',
        suggestedClassName: 'overflow-auto',
    },
    {
        deprecatedClassName: 'scroll-horizontal-if-needed',
        suggestedClassName: 'overflow-x-auto',
    },
    {
        deprecatedClassName: 'no-scroll',
        suggestedClassName: 'overflow-hidden',
    },
    {
        deprecatedClassName: 'ratio-container-square',
        suggestedClassName: 'ratio-square',
    },
    {
        deprecatedClassName: 'ratio-container-16-9',
        suggestedClassName: 'ratio-16/9',
    },
    {
        deprecatedClassName: 'ratio-container-5-1',
        suggestedClassName: 'ratio-5/1',
    },
    {
        deprecatedClassName: 'no-pointer-events',
        suggestedClassName: 'pointer-events-none',
    },
    {
        deprecatedClassName: 'increase-click-surface',
        suggestedClassName: 'expand-click-area',
    },
    {
        deprecatedClassName: 'no-border',
        suggestedClassName: 'border-none',
    },
];

export default {
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
