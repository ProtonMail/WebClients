import { STATUS } from './cache';

export const loadModels = async (models = [], { api, cache, useCache = true }) => {
    const result = await Promise.all(
        models.map((model) => {
            // Special case to not re-fetch the model if it exists. This can happen for
            // the user model which is set at login.
            if (useCache && cache.has(model.key)) {
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
