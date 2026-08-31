import type { UserModel } from '@proton/shared/lib/interfaces';

import * as useUserModule from '../../user/hooks';
import { buildUser } from '../buildUser';

export const mockUseUser = (value: [Partial<UserModel>?, boolean?] = []) => {
    const [user, cached = false] = value;
    const mockedUseUser = vi.spyOn(useUserModule, 'useUser');
    mockedUseUser.mockReturnValue([buildUser(user), Boolean(cached)]);
    return mockedUseUser;
};
