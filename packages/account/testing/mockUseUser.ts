import type { UserModel } from '@proton/shared/lib/interfaces';

import * as useUserModule from '../user/hooks';
import { buildUser } from './buildUser';

jest.mock('../user/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('../user/hooks'),
}));

export const mockUseUser = (value: [Partial<UserModel>?, boolean?] = []) => {
    const [user, cached = false] = value;
    const mockedUseUser = jest.spyOn(useUserModule, 'useUser');
    mockedUseUser.mockReturnValue([buildUser(user), Boolean(cached)]);
    return mockedUseUser;
};
