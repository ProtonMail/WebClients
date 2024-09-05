import { BrowserRouter as Router } from 'react-router-dom';

import {
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
    ThemeProvider,
} from '@proton/components';
import Icons from '@proton/icons/Icons';
import { APPS } from '@proton/shared/lib/constants';
import { PROTON_DEFAULT_THEME, PROTON_THEMES_MAP, getThemes } from '@proton/shared/lib/themes/themes';

import './prismjs.js';
import storybookTheme from './theme';

import '../src/app/index.scss';

const colorSchemes = ['default', 'ui-alias', 'ui-note', 'ui-password', 'ui-login'];
const themes = getThemes(true);

export const globalTypes = {
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
};

export const decorators = [
    (Story, context) => {
        const { theme: themeGlobal } = context.globals;

        const identifier = themes.find((theme) => theme.label === themeGlobal)?.identifier;

        const initialTheme = identifier || PROTON_DEFAULT_THEME;

        return (
            <Router>
                <ThemeProvider initial={initialTheme} appName={APPS.PROTONMAIL}>
                    <Icons />
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
];

const order = [
    'introduction-',
    'changelog-',
    'core-concepts-',
    '-theming-explanations-',
    '-theming-usage-',
    '-theming-taxonomy-',
    'components-',
    'css-utilities-',
];

export const parameters = {
    viewMode: 'docs',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    docs: { theme: storybookTheme },
    previewTabs: {
        canvas: { hidden: true },
    },
    options: {
        storySort: (a, b) => {
            const aName = a[0];
            const bName = b[0];

            if (order.some((name) => aName.includes(name) || bName.includes(name))) {
                const aIdx = order.findIndex((i) => aName.indexOf(i) > -1);
                const bIdx = order.findIndex((i) => bName.indexOf(i) > -1);
                return aIdx - bIdx;
            }

            return a[1].kind === b[1].kind ? 0 : a[1].id.localeCompare(b[1].id, undefined, { numeric: true });
        },
    },
};
