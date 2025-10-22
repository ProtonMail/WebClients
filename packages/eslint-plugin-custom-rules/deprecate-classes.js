/* eslint-env es6 */
import { createClassNameRule } from './lib/deprecate-classname-utils.js';

const deprecatedClasses = [
    {
        pattern: /^mauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use m-auto instead`,
    },
    {
        pattern: /^center$/,
        getMessage: (match) => `"${match}" is deprecated. Use mx-auto instead`,
    },
    {
        pattern: /^mxauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use mx-auto instead`,
    },
    {
        pattern: /^myauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use my-auto instead`,
    },
    {
        pattern: /^mtauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use mt-auto instead`,
    },
    {
        pattern: /^mrauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use mr-auto instead`,
    },
    {
        pattern: /^mbauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use mb-auto instead`,
    },
    {
        pattern: /^mlauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use ml-auto instead`,
    },
    {
        pattern: /^wauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use w-auto instead`,
    },
    {
        pattern: /^hauto$/,
        getMessage: (match) => `"${match}" is deprecated. Use h-auto instead`,
    },
    {
        pattern: /^h0$/,
        getMessage: (match) => `"${match}" is deprecated. Use h-0 instead`,
    },
    {
        pattern: /^h100$/,
        getMessage: (match) => `"${match}" is deprecated. Use h-full instead`,
    },
    {
        pattern: /^opacity-on-hover$/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:opacity-100 instead`,
    },
    {
        pattern: /^opacity-on-hover-container$/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:opacity-100 instead`,
    },
    {
        pattern: /^text-underline-on-hover$/,
        getMessage: (match) => `"${match}" is deprecated. Use hover:text-underline instead`,
    },
    {
        pattern: /^opacity-on-focus$/,
        getMessage: (match) => `"${match}" is deprecated. Use opacity-0 focus:opacity-100 instead`,
    },
    {
        pattern: /^hide-on-hover$/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:hidden instead`,
    },
    {
        pattern: /^hide-on-hover-container$/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:hidden instead`,
    },
    {
        pattern: /^on-hover-opacity-100$/,
        getMessage: (match) => `"${match}" is deprecated.`,
    },
    {
        pattern: /^flex-justify-start$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-start instead`,
    },
    {
        pattern: /^flex-justify-center$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-center instead`,
    },
    {
        pattern: /^flex-justify-end$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-end instead`,
    },
    {
        pattern: /^flex-justify-space-between$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-space-between instead`,
    },
    {
        pattern: /^flex-justify-space-around$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-space-around instead`,
    },
    {
        pattern: /^flex-justify-space-evenly$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-space-evenly instead`,
    },
    {
        pattern: /^flex-align-items-start$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-start instead`,
    },
    {
        pattern: /^flex-align-items-center$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-center instead`,
    },
    {
        pattern: /^flex-align-items-end$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-end instead`,
    },
    {
        pattern: /^flex-align-items-baseline$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-baseline instead`,
    },
    {
        pattern: /^flex-align-items-stretch$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-stretch instead`,
    },
    {
        pattern: /^flex-align-items-inherit$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-inherit instead`,
    },
    {
        pattern: /^flex-align-self-start$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-start instead`,
    },
    {
        pattern: /^flex-align-self-center$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-center instead`,
    },
    {
        pattern: /^flex-align-self-end$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-end instead`,
    },
    {
        pattern: /^flex-align-self-baseline$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-baseline instead`,
    },
    {
        pattern: /^flex-align-self-stretch$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-stretch instead`,
    },
    {
        pattern: /^flex-align-self-inherit$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-inherit instead`,
    },
    {
        pattern: /^flex-item-fluid-auto$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-auto instead`,
    },
    {
        pattern: /^flex-item-fluid$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-1 instead`,
    },
    {
        pattern: /^flex-item-noflex$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-none instead`,
    },
    {
        pattern: /^flex-item-grow$/,
        getMessage: (match) => `"${match}" is deprecated. Use grow instead`,
    },
    {
        pattern: /^flex-item-grow-2$/,
        getMessage: (match) => `"${match}" is deprecated. Use grow-2 instead`,
    },
    {
        pattern: /^flex-item-nogrow$/,
        getMessage: (match) => `"${match}" is deprecated. Use grow-0 instead`,
    },
    {
        pattern: /^flex-item-grow-custom$/,
        getMessage: (match) => `"${match}" is deprecated. Use grow-custom instead`,
    },
    {
        pattern: /^flex-item-shrink$/,
        getMessage: (match) => `"${match}" is deprecated. Use shrink instead`,
    },
    {
        pattern: /^flex-item-noshrink$/,
        getMessage: (match) => `"${match}" is deprecated. Use shrink-0 instead`,
    },
    {
        pattern: /^flex-flex-children$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex and *:flex instead`,
    },
    {
        pattern: /^flex-items-center$/,
        getMessage: (match) => `"${match}" is deprecated. Use *:items-center instead`,
    },
    {
        pattern: /^inline-flex-vcenter$/,
        getMessage: (match) => `"${match}" is deprecated. Use inline-flex and *:self-center instead`,
    },
    {
        pattern: /^flex-item-centered-vert$/,
        getMessage: (match) => `"${match}" is deprecated. Use self-center and my-auto instead`,
    },
    {
        pattern: /^flex-no-min-children$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex and *:min-size-auto instead`,
    },
    {
        pattern: /^flex-no-wrap$/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-nowrap instead`,
    },
    {
        pattern: /^hidden-empty$/,
        getMessage: (match) => `"${match}" is deprecated. Use empty:hidden instead`,
    },
    {
        pattern: /^scroll-if-needed$/,
        getMessage: (match) => `"${match}" is deprecated. Use overflow-auto instead`,
    },
    {
        pattern: /^scroll-horizontal-if-needed$/,
        getMessage: (match) => `"${match}" is deprecated. Use overflow-x-auto instead`,
    },
    {
        pattern: /^no-scroll$/,
        getMessage: (match) => `"${match}" is deprecated. Use overflow-hidden instead`,
    },
    {
        pattern: /^ratio-container-square$/,
        getMessage: (match) => `"${match}" is deprecated. Use ratio-square instead`,
    },
    {
        pattern: /^ratio-container-16-9$/,
        getMessage: (match) => `"${match}" is deprecated. Use ratio-16/9 instead`,
    },
    {
        pattern: /^ratio-container-5-1$/,
        getMessage: (match) => `"${match}" is deprecated. Use ratio-5/1 instead`,
    },
    {
        pattern: /^no-pointer-events$/,
        getMessage: (match) => `"${match}" is deprecated. Use pointer-events-none instead`,
    },
    {
        pattern: /^increase-click-surface$/,
        getMessage: (match) => `"${match}" is deprecated. Use expand-click-area instead`,
    },
    {
        pattern: /^no-border$/,
        getMessage: (match) => `"${match}" is deprecated. Use border-none instead`,
    },
];

export default {
    meta: {
        docs: {
            description: 'Detect deprecated CSS class names inside JSX className attributes.',
            url: 'https://design-system.protontech.ch',
        },
    },

    create: createClassNameRule(deprecatedClasses),
};
