import updateCollection from '../helpers/updateCollection';
import { getRemoteConfig } from '../api/remoteConfig';

export const getRemoteConfigModel = (api) => {
    return api(getRemoteConfig()).then(({ Config }) => Config);
};

export const RemoteConfigModel = {
    key: 'RemoteConfig',
    get: getRemoteConfigModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Config }) => Config }),
};
