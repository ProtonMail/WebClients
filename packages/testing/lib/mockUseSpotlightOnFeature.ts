import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';

jest.mock('@proton/components/hooks/useSpotlightOnFeature', () => ({
    __esModule: true,
    default: jest.fn(),
}));

type HookReturnType = ReturnType<typeof useSpotlightOnFeature>;
export const mockUseSpotlightOnFeature = (values: Partial<HookReturnType>) => {
    const mockedUseSpotlightOnFeature = useSpotlightOnFeature as jest.Mock;

    mockedUseSpotlightOnFeature.mockReturnValue({
        onDisplayed: () => {},
        onClose: () => {},
        show: false,
        ...values,
    });

    return mockedUseSpotlightOnFeature;
};
