import { STATUS } from './cache';
import { Api } from '../interfaces';
import { Cache } from '../helpers/cache';

interface Args {
    api: Api;
    cache: Cache<string, any>;
    useCache?: boolean;
}
export const loadModels = async (models: any[] = [], { api, cache, useCache = true }: Args): Promise<any[]> => {
    const result = await Promise.all(
        models.map((model) => {
            // Special case to not re-fetch the model if it exists. This can happen for
            // the user model which is set at login.
            if (useCache && cache.has(model.key)) {
                return cache.get(model.key).value as any;
            }
            return model.get(api);
        })
    );

    models.forEach((model, i) => {
        cache.set(model.key, {
            value: result[i],
            status: STATUS.RESOLVED,
        });
    });

    return result;
};
