import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
    theme: create({
        base: 'light',
        brandTitle: 'Lumo Design System',
        brandUrl: '?path=/docs/foundations-tokens--docs',
        brandTarget: '_self',
        colorPrimary: '#6439ed',
        colorSecondary: '#6439ed',
        appBg: '#f6f3fa',
        appContentBg: '#faf9fc',
        appBorderColor: '#e9e5f0',
        textColor: '#342943',
        fontBase: 'Inter, sans-serif',
    }),
});
