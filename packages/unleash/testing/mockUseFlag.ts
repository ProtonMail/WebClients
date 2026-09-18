// Package import so jest.spyOn matches modules resolved through @proton/unleash in consumers.
// eslint-disable-next-line custom-rules/no-package-self-import, import/no-extraneous-dependencies -- jest module identity
import * as useFlagModule from '@proton/unleash/useFlag';

export const mockUseFlag = (value: boolean = false) => {
    const mockedUseFlag = jest.spyOn(useFlagModule, 'useFlag');

    mockedUseFlag.mockReturnValue(value);

    return mockedUseFlag;
};
