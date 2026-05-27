import { logging } from '@proton/drive/modules/logging';

export const trashLogger = logging.getLogger('trash');

export const trashLogDebug = (label: string, rest: string | Record<string, unknown> = '') => {
    trashLogger.debug(`${label}: ${JSON.stringify(rest)}`);
};
