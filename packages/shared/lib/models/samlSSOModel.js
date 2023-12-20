import { getSAMLConfigs } from '../api/samlSSO';
import updateCollection from '../helpers/updateCollection';

export const getSamlSSOModel = (api) => {
    return api(getSAMLConfigs()).then(({ Configs }) => {
        return Configs;
    });
};

export const SamlSSOModel = {
    key: 'SSO',
    get: getSamlSSOModel,
    update: (model, events) => updateCollection({ model, events, itemKey: 'SSO' }),
};
