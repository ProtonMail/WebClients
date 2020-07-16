import { getOrganization } from '../api/organization';
import updateObject from '../helpers/updateObject';

export const getOrganizationModel = (api) => {
    return api(getOrganization()).then(({ Organization }) => Organization);
};

export const OrganizationModel = {
    key: 'Organization',
    get: getOrganizationModel,
    update: updateObject,
};
