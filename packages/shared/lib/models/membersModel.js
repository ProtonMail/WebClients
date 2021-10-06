import updateCollection from '../helpers/updateCollection';
import { getAllMembers } from '../api/members';

export const MembersModel = {
    key: 'Members',
    get: getAllMembers,
    update: (model, events) => updateCollection({ model, events, item: ({ Member }) => Member }),
};
