import * as useUserModule from '@proton/account/user/hooks';
import { UserModel } from '@proton/shared/lib/interfaces';

import { buildUser } from '../../builders';

export const mockUseUser = (value: [Partial<UserModel>?, boolean?] = []) => {
    const [user, cached = false] = value;
    const mockedUseUser = vi.spyOn(useUserModule, 'useUser');
    mockedUseUser.mockReturnValue([buildUser(user), Boolean(cached)]);
    return mockedUseUser;
};
