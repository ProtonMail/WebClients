import { fetchPendingUserInvitations } from '@proton/components/hooks/usePendingUserInvitations';

import updateCollection from '../helpers/updateCollection';

export const UserInvitationModel = {
    key: 'UserInvitations',
    get: fetchPendingUserInvitations,
    update: (model, events) => updateCollection({ model, events, itemKey: 'UserInvitation' }),
};
