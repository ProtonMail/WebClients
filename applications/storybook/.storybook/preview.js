import { BrowserRouter as Router } from 'react-router-dom';

import { Icons, NotificationsProvider, NotificationsChildren, ModalsProvider, ModalsChildren, CacheProvider } from '@proton/components';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import createCache from '@proton/shared/lib/helpers/cache';

import * as config from '../src/app/config';
import theme from './theme';
import '../src/app/index.scss';
import './prismjs.js';

const cacheRef = createCache();

const tempConfig = {
    ...config,
    APP_NAME: 'proton-mail',
};

export const decorators = [
    (Story) => (
        <Router>
            <ConfigProvider config={tempConfig}>
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
            </ConfigProvider>
        </Router>
    ),
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
