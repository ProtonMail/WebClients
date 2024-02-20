import { UserSettings } from '../../interfaces/drive/userSettings';

/* User settings*/
export const queryUserSettings = () => {
    return {
        method: 'get',
        url: `drive/me/settings`,
    };
};

export const queryUpdateUserSettings = (data: Partial<UserSettings>) => {
    return {
        method: 'put',
        url: `drive/me/settings`,
        data,
    };
};

/* User active ping */
export const queryUserActivePing = () => {
    return {
        method: 'get',
        url: `drive/me/active`,
    };
};
