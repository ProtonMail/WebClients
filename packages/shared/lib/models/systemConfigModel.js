import updateCollection from '../helpers/updateCollection';
import { getSystemConfig } from '../api/systemConfig';

export const getSystemConfigModel = (api) => {
    return api(getSystemConfig()).then(({ Config }) => Config);
};

export const SystemConfigModel = {
    key: 'SystemConfig',
    get: getSystemConfigModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Config }) => Config }),
};
