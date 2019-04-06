import { getUser } from '../api/user';
import { getInfo } from '../user/helpers';
import updateObject from '../helpers/updateObject';

export const formatUser = (User) => {
    return {
        ...User,
        ...getInfo(User)
    };
};

export const getUserModel = (api) => {
    return api(getUser()).then(({ User }) => formatUser(User));
};

export const UserModel = {
    key: 'User',
    get: getUserModel,
    update: (model, events) => formatUser(updateObject(model, events))
};
