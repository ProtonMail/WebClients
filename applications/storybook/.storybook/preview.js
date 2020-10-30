import React from 'react';

import {
    MimeIcons,
    Icons,
    NotificationsProvider,
    ModalsProvider,
    ModalsChildren,
    CacheProvider,
} from 'react-components';
import ApiProvider from 'react-components/containers/api/ApiProvider';
import ConfigProvider from 'react-components/containers/config/Provider';
import createCache from 'proton-shared/lib/helpers/cache';

import * as config from '../src/app/config';
import '../src/app/index.scss';

const cacheRef = createCache();

export const decorators = [(Story) => (
    <ConfigProvider config={config}>
        <Icons />
        <MimeIcons />
        <NotificationsProvider>
            <ModalsProvider>
                <ApiProvider config={config}>
                    <ModalsChildren />
                    <CacheProvider cache={cacheRef}>
                        <Story/>
                    </CacheProvider>
                </ApiProvider>
            </ModalsProvider>
        </NotificationsProvider>
    </ConfigProvider>
)];

export const parameters = {
    controls: { expanded: true },
}
