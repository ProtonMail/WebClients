import { createRoot } from 'react-dom/client';

import * as config from 'proton-pass-extension/app/config';
import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import sentry from '@proton/shared/lib/helpers/sentry';

import { Popup } from './Popup';

sentry({
    config,
    sentryConfig: {
        host: new URL(config.API_URL).host,
        release: config.APP_VERSION,
        environment: `browser-pass::popup`,
    },
    ignore: () => false,
    denyUrls: [],
});

const container = document.querySelector('.app-root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="popup">
        <ExtensionSetup>
            <Popup />
        </ExtensionSetup>
    </ExtensionRoot>
);
