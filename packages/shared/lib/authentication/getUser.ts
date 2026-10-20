import { getUser as getUserConfig } from '../api/user';
import type { Api } from '../interfaces/Api';
import type { User } from '../interfaces/User';

export const getUser = (api: Api) => {
    return api<{ User: User }>(getUserConfig()).then(({ User }) => User);
};
