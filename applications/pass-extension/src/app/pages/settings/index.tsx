import { createRoot } from 'react-dom/client';

import * as config from 'proton-pass-extension/app/config';
import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import sentry from '@proton/shared/lib/helpers/sentry';

import { Settings } from './Settings';

sentry({
    config,
    sentryConfig: {
        host: new URL(config.API_URL).host,
        release: config.APP_VERSION,
        environment: `browser-pass::settings`,
    },
    ignore: () => false,
    denyUrls: [],
});

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="page">
        <ExtensionSetup>
            <Settings />
        </ExtensionSetup>
    </ExtensionRoot>
);
