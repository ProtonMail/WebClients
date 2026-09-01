import useSpotlightOnFeature from '../hooks/useSpotlightOnFeature';

jest.mock('../hooks/useSpotlightOnFeature', () => ({
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
