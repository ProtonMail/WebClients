import { vi } from 'vitest';

// Package import so vi.spyOn matches modules resolved through @proton/features in consumers.
// eslint-disable-next-line custom-rules/no-package-self-import, proton/no-extraneous-dependencies -- vitest module identity
import * as useFeatureModule from '@proton/features/useFeature';
import type { DeepPartial } from '@proton/shared/lib/interfaces/utils';

vi.mock('@proton/features/useFeature', async () => ({
    __esModule: true,
    ...(await vi.importActual('@proton/features/useFeature')),
}));

type HookReturnType = ReturnType<typeof useFeatureModule.default>;

/**
 * Basic and raw useFeature mock. Use this mock if the original file has @proton/features/useFeature import.
 *
 * Example:
 * ```
 * const mockedUseFeature = mockUseFeature({ feature: { Value: true } });
 * expect(mockedUseFeature.code).toBe('FeatureCode');
 * ```
 *
 * More advanced mocks will be needed in case of components with multiple calls to useFeature
 */
export const mockUseFeature = (value?: DeepPartial<ReturnType<typeof useFeatureModule.default>>) => {
    const mockedUseFeature = vi.spyOn(useFeatureModule, 'default');

    mockedUseFeature.mockImplementation(
        (code) =>
            ({
                feature: {
                    Type: 'boolean',
                    DefaultValue: false,
                    Value: false,
                    Minimum: 0,
                    Maximum: 1,
                    Global: false,
                    Writable: false,
                    ExpirationTime: -1,
                    UpdateTime: -1,
                    Options: [],
                    ...value?.feature,
                    Code: code,
                },
                loading: false,
                get: vi.fn(),
                update: vi.fn(),
                ...value,
                code,
            }) as HookReturnType
    );

    return mockedUseFeature;
};
