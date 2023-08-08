import * as useUserModule from '@proton/components/hooks/useUser';
import { UserModel } from '@proton/shared/lib/interfaces';

type HookReturnType = ReturnType<typeof useUserModule.default>;
export const mockUseUser = (value: Partial<HookReturnType[0]>, loading: HookReturnType[1] = false) => {
    const mockedUseUser = jest.spyOn(useUserModule, 'default');

    mockedUseUser.mockReturnValue([
        {
            UsedSpace: 10,
            MaxSpace: 100,
            ...value,
        } as UserModel,
        loading,
        undefined,
    ]);

    return mockedUseUser;
};
