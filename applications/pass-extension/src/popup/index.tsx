import ReactDOM from 'react-dom';

import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from '../app/config';
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

const root = document.querySelector('.app-root') as HTMLElement;
ReactDOM.render(<Popup />, root);
