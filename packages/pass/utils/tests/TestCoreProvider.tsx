import type { FC, PropsWithChildren } from 'react';

import { getProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { PassCoreProvider } from '../../components/Core/PassCoreProvider';
import type { PassThemeOption } from '../../components/Layout/Theme/types';
import { PASS_DEFAULT_THEME } from '../../constants';
import type { PassCoreProxy } from '../../lib/core/core.types';
import type { MonitorService } from '../../lib/monitor/service';
import type { ConnectivityService } from '../../lib/network/connectivity.service';
import type { SettingsService } from '../../lib/settings/service';
import type { SpotlightProxy } from '../../lib/spotlight/service';
import { createObservableState } from '../pubsub/state';

export const TestCoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const config = getProtonConfig();
    const theme = { ...createObservableState<PassThemeOption>(PASS_DEFAULT_THEME), sync: noop };

    return (
        <PassCoreProvider
            connectivity={{} as ConnectivityService}
            config={config}
            endpoint="web"
            i18n={{} as any}
            theme={theme}
            core={{} as PassCoreProxy}
            monitor={{} as MonitorService}
            settings={{} as SettingsService}
            spotlight={{} as SpotlightProxy}
            generateOTP={() => null}
            getDomainImage={async () => undefined}
            getLogs={async () => []}
            onLink={noop}
            onTelemetry={noop}
            onB2BEvent={async () => false}
            openSettings={noop}
            writeToClipboard={async () => false}
        >
            {children}
        </PassCoreProvider>
    );
};
