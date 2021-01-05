import { create } from '@storybook/theming/create';

export default create({
    base: 'dark',

    colorPrimary: 'aquamarine',
    colorSecondary: 'deepskyblue',

    // UI
    appBg: 'white',
    appContentBg: 'white',
    appBorderColor: 'grey',
    appBorderRadius: 4,

    // Typography
    fontBase:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
    fontCode: 'SFMono-Regular, Consolas, "Liberation Mono", "Menlo", monospace, monospace',

    // Text colors
    textColor: 'black',
    textInverseColor: 'rgba(255,255,255,0.9)',

    // Toolbar default and active colors
    barTextColor: 'silver',
    barSelectedColor: 'black',
    barBg: 'hotpink',

    // Form colors
    inputBg: 'white',
    inputBorder: 'silver',
    inputTextColor: 'black',
    inputBorderRadius: 4,

    brandTitle: 'Proton Design System',
    brandUrl: 'https://protonmail.com/',
    brandImage: 'https://placehold.it/350x150',
});
