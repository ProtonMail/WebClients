import { Icons, NotificationsProvider, ModalsProvider, ModalsChildren, CacheProvider } from '@proton/components';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import createCache from '@proton/shared/lib/helpers/cache';

import theme from './theme';
import './index.scss';
import './prismjs.js';

const cacheRef = createCache();

const tempConfig = {
    ...config,
    APP_NAME: 'proton-mail',
};

const config = {
    CLIENT_TYPE: 1,
    CLIENT_SECRET: '',
    APP_VERSION: '4.999.999',
    COMMIT: '555f347c5ccc1e12c35db347337664fd277d23c3',
    BRANCH: 'heads/packages',
    DATE_VERSION: 'Fri, 14 Jan 2022 13:48:36 GMT',
    APP_NAME: 'proton-storybook',
    API_URL: '/api',
    LOCALES: {},
    API_VERSION: '3',
    VERSION_PATH: '/assets/version.json',
    SENTRY_DSN: '',
};

export const decorators = [
    (Story) => (
        <ConfigProvider config={tempConfig}>
            <Icons />
            <NotificationsProvider>
                <ModalsProvider>
                    <ApiProvider config={tempConfig}>
                        <ModalsChildren />
                        <CacheProvider cache={cacheRef}>
                            <Story />
                        </CacheProvider>
                    </ApiProvider>
                </ModalsProvider>
            </NotificationsProvider>
        </ConfigProvider>
    ),
];

const order = [
    'introduction-',
    'changelog-',
    'components-',
    'css-',
    'theming-explanations-',
    'theming-usage-',
    'theming-taxonomy-',
    'proton-ui-',
];

const priority = ['introduction-', 'changelog-', 'theming-'];

export const parameters = {
    viewMode: 'docs',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    docs: { theme: theme },
    options: {
        storySort: (a, b) => {
            const aName = a[0];
            const bName = b[0];

            if (priority.some((name) => aName.includes(name) || bName.includes(name))) {
                const aIdx = order.findIndex((i) => aName.indexOf(i) > -1);
                const bIdx = order.findIndex((i) => bName.indexOf(i) > -1);
                return aIdx - bIdx;
            }

            return a[1].kind === b[1].kind ? 0 : a[1].id.localeCompare(b[1].id, undefined, { numeric: true });
        },
    },
};
