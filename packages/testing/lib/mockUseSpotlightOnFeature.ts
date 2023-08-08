import * as useSpotlightOnFeatureModule from '@proton/components/hooks/useSpotlightOnFeature';

type HookReturnType = ReturnType<typeof useSpotlightOnFeatureModule.default>;
export const mockUseSpotlightOnFeature = (values: Partial<HookReturnType>) => {
    const mockedUseSpotlightOnFeature = jest.spyOn(useSpotlightOnFeatureModule, 'default');

    mockedUseSpotlightOnFeature.mockReturnValue({
        onDisplayed: () => {},
        onClose: () => {},
        show: false,
        ...values,
    });

    return mockedUseSpotlightOnFeature;
};
