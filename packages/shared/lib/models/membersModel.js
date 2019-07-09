import { queryMembers } from '../api/members';
import updateCollection from '../helpers/updateCollection';

export const getMembersModel = (api) => {
    return api(queryMembers()).then(({ Members }) => Members);
};

export const MembersModel = {
    key: 'Members',
    get: getMembersModel,
    update: (model, events) => updateCollection(model, events, 'Member')
};
