import { logging } from '../../modules/logging';

export const fileSaverLogger = logging.getLogger('FileSaver');

export const fileSaverLogDebug = (label: string, rest: string | Record<string, unknown> = '') => {
    fileSaverLogger.debug(`${label}: ${JSON.stringify(rest)}`);
};
