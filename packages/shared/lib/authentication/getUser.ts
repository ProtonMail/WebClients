import { getUser as getUserConfig } from '@proton/shared/lib/api/user';
import type { Api, User } from '@proton/shared/lib/interfaces';

export const getUser = (api: Api) => {
    return api<{ User: User }>(getUserConfig()).then(({ User }) => User);
};
