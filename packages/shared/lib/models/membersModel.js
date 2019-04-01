import { queryMembers, queryAddresses } from '../api/members';
import updateCollection from '../helpers/updateCollection';

export const updateMembersModel = (api, Members) => {
    return Promise.all(
        Members.map(async (member) => {
            if (member.addresses) {
                return member;
            }
            const { Addresses = [] } = await api(queryAddresses(member.ID));
            return {
                ...member,
                addresses: Addresses
            };
        })
    );
};

export const getMembersModel = (api) => {
    return api(queryMembers()).then(({ Members }) => updateMembersModel(api, Members));
};

export const MembersModel = {
    key: 'Members',
    get: getMembersModel,
    update: (model, events) => updateCollection(model, events, 'Member'),
    sync: updateMembersModel
};
