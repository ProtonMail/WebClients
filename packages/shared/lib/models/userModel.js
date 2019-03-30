import { getUser } from '../api/user';
import { getInfo } from '../user/helpers';
import updateObject from '../helpers/updateObject';

export const formatUser = (api, User) => {
    return {
        ...User,
        ...getInfo(User)
    };
};

export const getUserModel = (api) => {
    return api(getUser()).then(({ User }) => formatUser(api, User));
};

export const UserModel = {
    key: 'User',
    get: getUserModel,
    update: updateObject,
    sync: formatUser
};
