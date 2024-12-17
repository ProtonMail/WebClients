import log from 'electron-log/main';

import { isProdEnv } from './platform';

const logger = log.create({ logId: 'electron' });

if (isProdEnv() && !Boolean(process.env.PASS_DEBUG)) {
    logger.transports.console.level = 'info';
}

export default logger;
