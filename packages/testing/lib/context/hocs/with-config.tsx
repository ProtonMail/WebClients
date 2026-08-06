import type { ComponentType } from 'react';

import ConfigProvider from '@proton/components/containers/config/Provider';
import { CLIENT_TYPES } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

export const defaultProtonConfig: ProtonConfig = {
    CLIENT_TYPE: CLIENT_TYPES.MAIL,
    CLIENT_SECRET: 'secret',
    APP_VERSION: '1.0.0',
    APP_NAME: 'proton-account',
    API_URL: 'https://proton.me/api',
    LOCALES: {},
    DATE_VERSION: '2020-01-01',
    COMMIT: 'b8a9c0d1e2f3a4b5c6d4e8f9a0b2c2d3e4f5a6b7',
    BRANCH: 'main',
    SENTRY_DSN: '',
    SSO_URL: '',
    VERSION_PATH: '/version.json',
    LOGICAL_SCSS: true,
};

export const withConfig =
    (config: ProtonConfig = defaultProtonConfig) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function ConfigProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <ConfigProvider config={config}>
                    <Component {...props} />
                </ConfigProvider>
            );
        };
