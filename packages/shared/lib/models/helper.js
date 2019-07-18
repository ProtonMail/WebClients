import { UserModel } from './userModel';
import { STATUS } from './cache';
import { setupEventManager } from './setupEventManager';
import { getLatestID } from '../api/events';

const getEventID = (api) => api(getLatestID()).then(({ EventID }) => EventID);

/**
 * Given a list of models, preload them and set them in the cache.
 * TODO: Add support for dependencies. E.g. to know if we can fetch
 * subscription model or organization model, we have fetch the user model first.
 * @param {Array} models
 * @param {Function} api
 * @param {Map} cache
 * @return {Promise<Array>}
 */
export const loadModels = async (models = [], { api, cache }) => {
    const result = await Promise.all(
        models.map((model) => {
            // Special case to not re-fetch it if it exists.
            if (model === UserModel) {
                if (cache.has(UserModel.key)) {
                    return cache.get(UserModel.key).value;
                }
            }
            return model.get(api);
        })
    );

    models.forEach((model, i) => {
        cache.set(model.key, {
            value: result[i],
            status: STATUS.RESOLVED
        });
    });

    return result;
};

/**
 * Create event manager.
 * @param {Array} models
 * @param {Function} api
 * @param {Map} cache
 * @return {Promise<{call, setEventID, stop, start, reset}>}
 */
export const createEventManager = async (models = [], { api, cache }) => {
    // Set from <ProtonApp/> on login.
    const { eventID: tmpEventID } = cache.get('tmp') || {};
    cache.set('tmp', undefined);

    const eventID = await Promise.resolve(tmpEventID || getEventID(api));

    return setupEventManager({
        models,
        api,
        cache,
        eventID
    });
};
