import ReactDOM from 'react-dom';

import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from '../../app/config';
import { Settings } from './Settings';

import '../../shared/styles/common.scss';

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

const root = document.getElementById('root') as HTMLElement;
ReactDOM.render(<Settings />, root);
