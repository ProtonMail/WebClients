import { createRoot } from 'react-dom/client';

import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from '../../config';
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
root.render(<Settings />);
