import updateCollection from '../helpers/updateCollection';
import { fetchPendingUserInvitations } from './userInvitationModelApi';

export const UserInvitationModel = {
    key: 'UserInvitations',
    get: fetchPendingUserInvitations,
    update: (model, events) => updateCollection({ model, events, itemKey: 'UserInvitation' }),
};
