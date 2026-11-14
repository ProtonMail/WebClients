import { vi } from 'vitest';

// Package import so vi.spyOn matches modules resolved through @proton/unleash in consumers.
// eslint-disable-next-line custom-rules/no-package-self-import, proton/no-extraneous-dependencies -- vitest module identity
import * as useFlagModule from '@proton/unleash/useFlag';

vi.mock('@proton/unleash/useFlag', async () => ({
    __esModule: true,
    ...(await vi.importActual('@proton/unleash/useFlag')),
}));

export const mockUseFlag = (value: boolean = false) => {
    const mockedUseFlag = vi.spyOn(useFlagModule, 'useFlag');

    mockedUseFlag.mockReturnValue(value);

    return mockedUseFlag;
};
