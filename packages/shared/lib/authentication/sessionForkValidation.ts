import { APP_NAMES, FORKABLE_APPS } from '../constants';
import { decodeBase64URL, stringToUint8Array } from '../helpers/encoding';
import { FORK_TYPE } from './ForkInterface';

export const getValidatedApp = (app = ''): APP_NAMES | undefined => {
    if (FORKABLE_APPS.has(app as any)) {
        return app as APP_NAMES;
    }
};

export const getValidatedLocalID = (localID = '') => {
    if (!localID) {
        return;
    }
    const maybeLocalID = parseInt(localID, 10);
    if (Number.isInteger(maybeLocalID) && maybeLocalID >= 0 && maybeLocalID <= 100000000) {
        return maybeLocalID;
    }
};

export const getValidatedRawKey = (str: string) => {
    try {
        return stringToUint8Array(decodeBase64URL(str));
    } catch (e: any) {
        return undefined;
    }
};
export const getValidatedForkType = (str: string) => {
    if (Object.values(FORK_TYPE).includes(str as FORK_TYPE)) {
        return str as FORK_TYPE;
    }
};
