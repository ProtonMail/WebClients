import * as useFeatureModule from '@proton/features';
import type { DeepPartial } from '@proton/shared/lib/interfaces';

jest.mock('@proton/features', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/features'),
}));

type HookReturnType = ReturnType<typeof useFeatureModule.useFeature>;

/**
 * Basic and raw useFeature mock. Use this mock if the original file has @proton/features import.
 *
 * Example:
 * ```
 * const mockedUseFeature = mockUseFeatureBarrel({ feature: { Value: true } });
 * expect(mockedUseFeature.code).toBe('FeatureCode');
 * ```
 *
 * More advanced mocks will be needed in case of components with multiple calls to useFeature
 */
export const mockUseFeatureBarrel = (value?: DeepPartial<ReturnType<typeof useFeatureModule.useFeature>>) => {
    const mockedUseFeature = jest.spyOn(useFeatureModule, 'useFeature');

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
                get: jest.fn(),
                update: jest.fn(),
                ...value,
                code,
            }) as HookReturnType
    );

    return mockedUseFeature;
};
