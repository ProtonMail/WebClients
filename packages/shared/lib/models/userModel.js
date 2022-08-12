import { getUser } from '../api/user';
import updateObject from '../helpers/updateObject';
import { getInfo } from '../user/helpers';

export const formatUser = (User) => {
    return {
        ...User,
        ...getInfo(User),
    };
};

export const getUserModel = (api) => {
    return api(getUser()).then(({ User }) => formatUser(User));
};

export const UserModel = {
    key: 'User',
    get: getUserModel,
    update: (model, events) => formatUser(updateObject(model, events)),
};
