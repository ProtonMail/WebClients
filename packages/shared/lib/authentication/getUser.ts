import { getUser as getUserConfig } from '../api/user';
import type { Api, User } from '../interfaces';

export const getUser = (api: Api) => {
    return api<{ User: User }>(getUserConfig()).then(({ User }) => User);
};
