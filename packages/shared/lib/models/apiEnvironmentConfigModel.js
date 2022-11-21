import { getApiEnvConfig } from '../api/apiEnvironmentConfig';
import updateCollection from '../helpers/updateCollection';

export const getApiEnvironmentConfigModel = (api) => {
    return api(getApiEnvConfig()).then(({ Config }) => Config);
};

export const ApiEnvironmentConfigModel = {
    key: 'ApiEnvironmentConfig',
    get: getApiEnvironmentConfigModel,
    update: (model, events) => updateCollection({ model, events, itemKey: 'Config' }),
};
