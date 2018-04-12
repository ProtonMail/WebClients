import _ from 'lodash';
import { TIME } from '../../constants';

const TIMEOUT = 10 * TIME.MINUTE;

/* @ngInject */
function keyCache(Key) {
    const CACHE = {};

    const formatCache = (data = {}) => ({ time: Date.now(), data });

    const getKeysFromApi = async (email) => {
        const data = await Key.keys(email);
        CACHE[email] = formatCache(_.pick(data, 'RecipientType', 'MIMEType', 'Keys'));
        return CACHE[email].data;
    };

    const getKeysPerEmail = async (email) => {
        const inCache = _.has(CACHE, email) && CACHE[email].time + TIMEOUT > Date.now();
        if (!inCache) {
            CACHE[email] = formatCache(await getKeysFromApi(email));
        }
        return CACHE[email].data;
    };

    const get = (emails) => {
        return Promise.all(emails.map(getKeysPerEmail)).then((keys) => _.zipObject(emails, keys));
    };

    return { get };
}
export default keyCache;
