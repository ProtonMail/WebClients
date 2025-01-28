import * as useUserModule from '@proton/account/user/hooks';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { buildUser } from '../builders';

jest.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/account/user/hooks'),
}));

export const mockUseUser = (value: [Partial<UserModel>?, boolean?] = []) => {
    const [user, cached = false] = value;
    const mockedUseUser = jest.spyOn(useUserModule, 'useUser');
    mockedUseUser.mockReturnValue([buildUser(user), Boolean(cached)]);
    return mockedUseUser;
};
