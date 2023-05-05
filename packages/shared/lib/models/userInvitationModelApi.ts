import { getInvitations } from '@proton/shared/lib/api/user';
import { Api, PendingInvitation as PendingUserInvitation } from '@proton/shared/lib/interfaces';

export const fetchPendingUserInvitations = (api: Api) =>
    api<{ UserInvitations: PendingUserInvitation[] }>(getInvitations()).then(({ UserInvitations }) => {
        return UserInvitations;
    });
