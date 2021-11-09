import updateCollection from '../helpers/updateCollection';
import { getApiEnvConfig } from '../api/apiEnvironmentConfig';

export const getApiEnvironmentConfigModel = (api) => {
    return api(getApiEnvConfig()).then(({ Config }) => Config);
};

export const ApiEnvironmentConfigModel = {
    key: 'ApiEnvironmentConfig',
    get: getApiEnvironmentConfigModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Config }) => Config }),
};
