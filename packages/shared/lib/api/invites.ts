import { CLIENT_TYPES } from '../constants';

export const createInvitation = ({ Email, Type }: { Email: string; Type: CLIENT_TYPES }) => ({
    method: 'post',
    url: 'invites',
    data: { Email, Type },
});

export const checkInvitation = (data: { Selector: string; Token: string; Type: CLIENT_TYPES }) => ({
    method: 'post',
    url: 'invites/check',
    data,
});
