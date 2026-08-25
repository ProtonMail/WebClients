import * as useShowUpsellBannerModule from '../../hooks/useShowUpsellBanner';
import * as useAutoDeleteBannerModule from './banners/auto-delete/useAutodeleteBanner';

jest.mock('../../hooks/useShowUpsellBanner', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('./banners/auto-delete/useAutodeleteBanner', () => ({
    __esModule: true,
    default: jest.fn(),
}));

export const mockUseAutoDeleteBanner = (value?: Partial<ReturnType<typeof useAutoDeleteBannerModule.default>>) => {
    const mockedUseAutoDeleteBanner = jest.mocked(useAutoDeleteBannerModule.default);

    mockedUseAutoDeleteBanner.mockReturnValue(value ?? 'hide');

    return mockedUseAutoDeleteBanner;
};

export const mockUseShowUpsellBanner = (value?: Partial<ReturnType<typeof useShowUpsellBannerModule.default>>) => {
    const mockedUseShowUpsellBanner = jest.mocked(useShowUpsellBannerModule.default);

    mockedUseShowUpsellBanner.mockReturnValue({
        canDisplayUpsellBanner: false,
        needToShowUpsellBanner: { current: false },
        handleDismissBanner: jest.fn(),
        ...value,
    });

    return mockedUseShowUpsellBanner;
};
