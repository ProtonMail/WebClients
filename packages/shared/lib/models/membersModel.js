import { getAllMembers } from '../api/members';
import updateCollection from '../helpers/updateCollection';

export const MembersModel = {
    key: 'Members',
    get: getAllMembers,
    update: (model, events) => updateCollection({ model, events, itemKey: 'Member' }),
};
