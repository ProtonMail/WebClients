import type { CLIENT_TYPES } from '../constants';

export const checkInvitation = (data: { Selector: string; Token: string; Type: CLIENT_TYPES }) => ({
    method: 'post',
    url: 'core/v4/invites/check',
    data,
});
