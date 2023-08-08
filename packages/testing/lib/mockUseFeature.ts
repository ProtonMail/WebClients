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
export const mockUseFeature = (value: DeepPartial<HookReturnType>) => {
    const mockedUseFeature = jest.spyOn(useFeatureModule, 'default');

    mockedUseFeature.mockImplementation(
        (...params) =>
            ({
                code: params[0],
                ...value,
                feature: {
                    Code: params[0],
                    Value: value,
                    ...value.feature,
                },
            } as HookReturnType)
    );

    return mockedUseFeature;
};
