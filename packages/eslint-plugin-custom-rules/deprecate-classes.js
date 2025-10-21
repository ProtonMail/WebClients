/* eslint-env es6 */
import { createClassNameRule } from './lib/deprecate-classname-utils.js';

const deprecatedClasses = [
    {
        pattern: /\bmauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use m-auto instead`,
    },
    {
        pattern: /\bcenter\b/,
        getMessage: (match) => `"${match}" is deprecated. Use mx-auto instead`,
    },
    {
        pattern: /\bmxauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use mx-auto instead`,
    },
    {
        pattern: /\bmyauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use my-auto instead`,
    },
    {
        pattern: /\bmtauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use mt-auto instead`,
    },
    {
        pattern: /\bmrauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use mr-auto instead`,
    },
    {
        pattern: /\bmbauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use mb-auto instead`,
    },
    {
        pattern: /\bmlauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use ml-auto instead`,
    },
    {
        pattern: /\bwauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use w-auto instead`,
    },
    {
        pattern: /\bhauto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use h-auto instead`,
    },
    {
        pattern: /\bh0\b/,
        getMessage: (match) => `"${match}" is deprecated. Use h-0 instead`,
    },
    {
        pattern: /\bh100\b/,
        getMessage: (match) => `"${match}" is deprecated. Use h-full instead`,
    },
    {
        pattern: /\bopacity-on-hover\b/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:opacity-100 instead`,
    },
    {
        pattern: /\bopacity-on-hover-container\b/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:opacity-100 instead`,
    },
    {
        pattern: /\btext-underline-on-hover\b/,
        getMessage: (match) => `"${match}" is deprecated. Use hover:text-underline instead`,
    },
    {
        pattern: /\bopacity-on-focus\b/,
        getMessage: (match) => `"${match}" is deprecated. Use opacity-0 focus:opacity-100 instead`,
    },
    {
        pattern: /\bhide-on-hover\b/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:hidden instead`,
    },
    {
        pattern: /\bhide-on-hover-container\b/,
        getMessage: (match) => `"${match}" is deprecated. Use group-hover:hidden instead`,
    },
    {
        pattern: /\bon-hover-opacity-100\b/,
        getMessage: (match) => `"${match}" is deprecated.`,
    },
    {
        pattern: /\bflex-justify-start\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-start instead`,
    },
    {
        pattern: /\bflex-justify-center\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-center instead`,
    },
    {
        pattern: /\bflex-justify-end\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-end instead`,
    },
    {
        pattern: /\bflex-justify-space-between\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-space-between instead`,
    },
    {
        pattern: /\bflex-justify-space-around\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-space-around instead`,
    },
    {
        pattern: /\bflex-justify-space-evenly\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-space-evenly instead`,
    },
    {
        pattern: /\bflex-align-items-start\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-start instead`,
    },
    {
        pattern: /\bflex-align-items-center\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-center instead`,
    },
    {
        pattern: /\bflex-align-items-end\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-end instead`,
    },
    {
        pattern: /\bflex-align-items-baseline\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-baseline instead`,
    },
    {
        pattern: /\bflex-align-items-stretch\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-stretch instead`,
    },
    {
        pattern: /\bflex-align-items-inherit\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-inherit instead`,
    },
    {
        pattern: /\bflex-align-self-start\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-start instead`,
    },
    {
        pattern: /\bflex-align-self-center\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-center instead`,
    },
    {
        pattern: /\bflex-align-self-end\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-end instead`,
    },
    {
        pattern: /\bflex-align-self-baseline\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-baseline instead`,
    },
    {
        pattern: /\bflex-align-self-stretch\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-stretch instead`,
    },
    {
        pattern: /\bflex-align-self-inherit\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-inherit instead`,
    },
    {
        pattern: /\bflex-item-fluid-auto\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-auto instead`,
    },
    {
        pattern: /\bflex-item-fluid\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-1 instead`,
    },
    {
        pattern: /\bflex-item-noflex\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-none instead`,
    },
    {
        pattern: /\bflex-item-grow\b/,
        getMessage: (match) => `"${match}" is deprecated. Use grow instead`,
    },
    {
        pattern: /\bflex-item-grow-2\b/,
        getMessage: (match) => `"${match}" is deprecated. Use grow-2 instead`,
    },
    {
        pattern: /\bflex-item-nogrow\b/,
        getMessage: (match) => `"${match}" is deprecated. Use grow-0 instead`,
    },
    {
        pattern: /\bflex-item-grow-custom\b/,
        getMessage: (match) => `"${match}" is deprecated. Use grow-custom instead`,
    },
    {
        pattern: /\bflex-item-shrink\b/,
        getMessage: (match) => `"${match}" is deprecated. Use shrink instead`,
    },
    {
        pattern: /\bflex-item-noshrink\b/,
        getMessage: (match) => `"${match}" is deprecated. Use shrink-0 instead`,
    },
    {
        pattern: /\bflex-flex-children\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex and *:flex instead`,
    },
    {
        pattern: /\bflex-items-center\b/,
        getMessage: (match) => `"${match}" is deprecated. Use *:items-center instead`,
    },
    {
        pattern: /\binline-flex-vcenter\b/,
        getMessage: (match) => `"${match}" is deprecated. Use inline-flex and *:self-center instead`,
    },
    {
        pattern: /\bflex-item-centered-vert\b/,
        getMessage: (match) => `"${match}" is deprecated. Use self-center and my-auto instead`,
    },
    {
        pattern: /\bflex-no-min-children\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex and *:min-size-auto instead`,
    },
    {
        pattern: /\bflex-no-wrap\b/,
        getMessage: (match) => `"${match}" is deprecated. Use flex-nowrap instead`,
    },
    {
        pattern: /\bhidden-empty\b/,
        getMessage: (match) => `"${match}" is deprecated. Use empty:hidden instead`,
    },
    {
        pattern: /\bscroll-if-needed\b/,
        getMessage: (match) => `"${match}" is deprecated. Use overflow-auto instead`,
    },
    {
        pattern: /\bscroll-horizontal-if-needed\b/,
        getMessage: (match) => `"${match}" is deprecated. Use overflow-x-auto instead`,
    },
    {
        pattern: /\bno-scroll\b/,
        getMessage: (match) => `"${match}" is deprecated. Use overflow-hidden instead`,
    },
    {
        pattern: /\bratio-container-square\b/,
        getMessage: (match) => `"${match}" is deprecated. Use ratio-square instead`,
    },
    {
        pattern: /\bratio-container-16-9\b/,
        getMessage: (match) => `"${match}" is deprecated. Use ratio-16/9 instead`,
    },
    {
        pattern: /\bratio-container-5-1\b/,
        getMessage: (match) => `"${match}" is deprecated. Use ratio-5/1 instead`,
    },
    {
        pattern: /\bno-pointer-events\b/,
        getMessage: (match) => `"${match}" is deprecated. Use pointer-events-none instead`,
    },
    {
        pattern: /\bincrease-click-surface\b/,
        getMessage: (match) => `"${match}" is deprecated. Use expand-click-area instead`,
    },
    {
        pattern: /\bno-border\b/,
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
