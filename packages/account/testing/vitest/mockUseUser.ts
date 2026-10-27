import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';

import * as useUserModule from '../../user/hooks';

export const mockUseUser = (value: [Partial<UserModel>?, boolean?] = []) => {
    const [user, cached = false] = value;
    const mockedUseUser = vi.spyOn(useUserModule, 'useUser');
    mockedUseUser.mockReturnValue([buildUser(user), Boolean(cached)]);
    return mockedUseUser;
};
