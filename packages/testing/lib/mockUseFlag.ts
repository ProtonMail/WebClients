import * as useFlagModule from '@unleash/proxy-client-react';

export const mockUseFlag = (value: boolean = false) => {
    const mockedUseFlag = jest.spyOn(useFlagModule, 'useFlag');

    mockedUseFlag.mockReturnValue(value);

    return mockedUseFlag;
};
