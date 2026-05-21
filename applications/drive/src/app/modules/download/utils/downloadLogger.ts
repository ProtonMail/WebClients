import { logging } from '../../../modules/logging';

export const downloadLogger = logging.getLogger('download-manager');

export const downloadLogDebug = (label: string, rest: string | Record<string, unknown> = '') => {
    downloadLogger.debug(`${label}: ${JSON.stringify(rest)}`);
};
