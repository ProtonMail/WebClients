import { BrowserRouter as Router } from 'react-router-dom';

import {
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
    ThemeProvider,
} from '@proton/components';
import InlineIcons from '@proton/icons/InlineIcons';
import { APPS } from '@proton/shared/lib/constants';
import { PROTON_DEFAULT_THEME, PROTON_THEMES_MAP, getThemes } from '@proton/shared/lib/themes/themes';

import './prismjs.js';
import storybookTheme from './theme';

import '../src/app/index.scss';

const colorSchemes = ['default', 'ui-alias', 'ui-note', 'ui-password', 'ui-login'];
const themes = getThemes(true);

/** @type { import('@storybook/react').Preview } */
const preview = {
    globalTypes: {
        theme: {
            name: 'Theme',
            description: 'Proton theme, globally applied to stories',
            defaultValue: PROTON_THEMES_MAP[PROTON_DEFAULT_THEME].label,
            toolbar: {
                icon: 'paintbrush',
                items: themes.map(({ label }) => label),
                showName: true,
                title: 'Theme',
                dynamicTitle: true,
            },
        },
        scheme: {
            name: 'Color Scheme',
            description: 'Pass specific color schemes',
            defaultValue: 'default',
            toolbar: {
                icon: 'paintbrush',
                items: colorSchemes.map((label) => label),
                showName: true,
                title: 'Scheme',
                dynamicTitle: true,
            },
        },
    },
    decorators: [
        (Story, context) => {
            const { theme: themeGlobal } = context.globals;

            const identifier = themes.find((theme) => theme.label === themeGlobal)?.identifier;

            const initialTheme = identifier || PROTON_DEFAULT_THEME;

            return (
                <Router>
                    <ThemeProvider initial={initialTheme} appName={APPS.PROTONMAIL}>
                        <InlineIcons />
                        <NotificationsProvider>
                            <ModalsProvider>
                                <NotificationsChildren />
                                <ModalsChildren />
                                <Story />
                            </ModalsProvider>
                        </NotificationsProvider>
                    </ThemeProvider>
                </Router>
            );
        },
        (Story, context) => {
            return (
                <div className={context.globals.scheme}>
                    <Story />
                </div>
            );
        },
    ],
    parameters: {
        viewMode: 'docs',
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: { expanded: true },
        docs: { theme: storybookTheme },
        previewTabs: {
            canvas: { hidden: true },
        },
        options: {
            storySort: {
                order: [
                    'Introduction',
                    'Changelog',
                    'Core Concepts',
                    ['Typography', 'Colors', 'Icons'],
                    'Components',
                    'CSS Utilities',
                    ['Colors', 'Columns', 'Flexbox', '*'],
                ],
                method: 'alphabetical',
                locales: 'en-US',
            },
        },
    },
};

export default preview;
