import * as useUserModule from '@proton/components/hooks/useUser';
import { UserModel } from '@proton/shared/lib/interfaces';

import { buildUser } from '../builders';

export const mockUseUser = (value: [Partial<UserModel>?, boolean?, any?] = []) => {
    const [user, cached, miss = jest.fn()] = value;
    const mockedUseUser = jest.spyOn(useUserModule, 'default');
    mockedUseUser.mockReturnValue([buildUser(user), Boolean(cached), miss]);
    return mockedUseUser;
};
