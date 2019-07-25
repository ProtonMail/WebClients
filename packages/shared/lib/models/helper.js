import { STATUS } from './cache';

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
            // Special case to not re-fetch the model if it exists. This can happen for
            // the user model which is set at login.
            if (cache.has(model.key)) {
                return cache.get(model.key).value;
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
