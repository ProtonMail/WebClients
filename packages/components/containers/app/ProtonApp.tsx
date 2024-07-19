import type { ComponentType, ReactNode } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import { Icons } from '../../components';
import SpotlightProvider from '../../components/spotlight/Provider';
import { PreventLeaveProvider } from '../../hooks';
import CacheProvider from '../cache/Provider';
import CompatibilityCheck from '../compatibilityCheck/CompatibilityCheck';
import ConfigProvider from '../config/Provider';
import ModalsProvider from '../modals/Provider';
import NotificationsProvider from '../notifications/Provider';
import RightToLeftProvider from '../rightToLeft/Provider';
import DefaultThemeProvider from '../themes/ThemeProvider';

interface Props {
    config: ProtonConfig;
    children: ReactNode;
    ThemeProvider?: ComponentType<{
        children: ReactNode;
        appName: APP_NAMES;
    }>;
}

const ProtonApp = ({ config, children, ThemeProvider = DefaultThemeProvider }: Props) => {
    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Icons />
                <RightToLeftProvider>
                    <ThemeProvider appName={config.APP_NAME}>
                        <PreventLeaveProvider>
                            <SpotlightProvider>
                                <NotificationsProvider>
                                    <ModalsProvider>
                                        <CacheProvider>{children}</CacheProvider>
                                    </ModalsProvider>
                                </NotificationsProvider>
                            </SpotlightProvider>
                        </PreventLeaveProvider>
                    </ThemeProvider>
                </RightToLeftProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

export default ProtonApp;
