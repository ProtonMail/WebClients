import { ReactNode } from 'react';

import { ProtonConfig } from '@proton/shared/lib/interfaces';

import { Icons } from '../../components';
import SpotlightProvider from '../../components/spotlight/Provider';
import { PreventLeaveProvider } from '../../hooks';
import CacheProvider from '../cache/Provider';
import CompatibilityCheck from '../compatibilityCheck/CompatibilityCheck';
import ConfigProvider from '../config/Provider';
import ModalsProvider from '../modals/Provider';
import NotificationsProvider from '../notifications/Provider';
import RightToLeftProvider from '../rightToLeft/Provider';
import ThemeProvider from '../themes/ThemeProvider';

interface Props {
    config: ProtonConfig;
    children: ReactNode;
}

const ProtonApp = ({ config, children }: Props) => {
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
