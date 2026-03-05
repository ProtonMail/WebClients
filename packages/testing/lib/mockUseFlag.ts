import * as useFlagModule from '@proton/unleash/useFlag';

export const mockUseFlag = (value: boolean = false) => {
    const mockedUseFlag = jest.spyOn(useFlagModule, 'useFlag');

    mockedUseFlag.mockReturnValue(value);

    return mockedUseFlag;
};
