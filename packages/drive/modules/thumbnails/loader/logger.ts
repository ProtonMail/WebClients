import { Logging } from '../../logging';

const logging = new Logging({ sentryComponent: 'drive-web-log' });
export const logger = logging.getLogger('thumbnails-loader');
