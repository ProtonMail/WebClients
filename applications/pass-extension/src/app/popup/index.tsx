import { createRoot } from 'react-dom/client';

import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from '../../app/config';
import Popup from './Popup';

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
root.render(<Popup />);
