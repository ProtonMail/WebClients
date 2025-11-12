import type { FC, PropsWithChildren } from 'react';

import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import type { MonitorService } from '@proton/pass/lib/monitor/service';
import type { SettingsService } from '@proton/pass/lib/settings/service';
import type { SpotlightProxy } from '@proton/pass/lib/spotlight/service';
import { createObservableState } from '@proton/pass/utils/pubsub/state';
import { getProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

export const TestCoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const config = getProtonConfig();
    const theme = { ...createObservableState<PassThemeOption>(PASS_DEFAULT_THEME), sync: noop };

    return (
        <PassCoreProvider
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
            writeToClipboard={async () => false}
        >
            {children}
        </PassCoreProvider>
    );
};
