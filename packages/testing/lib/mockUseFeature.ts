import * as useFeatureModule from '@proton/components/hooks/useFeature';
import { DeepPartial } from '@proton/shared/lib/interfaces';

type HookReturnType = ReturnType<typeof useFeatureModule.default>;

/**
 * Basic and raw useFeature mock
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
    const mockedUseFeature = jest.spyOn(useFeatureModule, 'default');

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
            } as HookReturnType)
    );

    return mockedUseFeature;
};
