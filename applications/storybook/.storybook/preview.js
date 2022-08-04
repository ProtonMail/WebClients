import { BrowserRouter as Router } from 'react-router-dom';

import {
    CacheProvider,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
    ThemeProvider,
    useTheme,
} from '@proton/components';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import createCache from '@proton/shared/lib/helpers/cache';
import { PROTON_DEFAULT_THEME, PROTON_THEMES, PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';

import * as config from '../src/app/config';
import './prismjs.js';
import theme from './theme';

import '../src/app/index.scss';

const cacheRef = createCache();

const tempConfig = {
    ...config,
    APP_NAME: 'proton-mail',
};

export const globalTypes = {
    theme: {
        name: 'Theme',
        description: 'Proton theme, globally applied to stories',
        defaultValue: PROTON_THEMES_MAP[PROTON_DEFAULT_THEME].label,
        toolbar: {
            icon: 'paintbrush',
            items: PROTON_THEMES.map(({ label }) => label),
            showName: true,
            dynamicTitle: true,
        },
    },
};

export const decorators = [
    (Story, context) => {
        const { theme: themeGlobal } = context.globals;

        const identifier = PROTON_THEMES.find((theme) => theme.label === themeGlobal)?.identifier;

        const initialTheme = identifier || PROTON_DEFAULT_THEME;

        return (
            <Router>
                <ConfigProvider config={tempConfig}>
                    <ThemeProvider initial={initialTheme}>
                        <Icons />
                        <NotificationsProvider>
                            <ModalsProvider>
                                <ApiProvider config={tempConfig}>
                                    <NotificationsChildren />
                                    <ModalsChildren />
                                    <CacheProvider cache={cacheRef}>
                                        <Story />
                                    </CacheProvider>
                                </ApiProvider>
                            </ModalsProvider>
                        </NotificationsProvider>
                    </ThemeProvider>
                </ConfigProvider>
            </Router>
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
    docs: { theme: theme },
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
