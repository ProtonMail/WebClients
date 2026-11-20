import * as useShowUpsellBannerModule from '../../hooks/useShowUpsellBanner';
import * as useAutoDeleteBannerModule from './banners/auto-delete/useAutodeleteBanner';

export const mockUseAutoDeleteBanner = (value?: Partial<ReturnType<typeof useAutoDeleteBannerModule.default>>) => {
    const mockedUseAutoDeleteBanner = vi.mocked(useAutoDeleteBannerModule.default);

    mockedUseAutoDeleteBanner.mockReturnValue(value ?? 'hide');

    return mockedUseAutoDeleteBanner;
};

export const mockUseShowUpsellBanner = (value?: Partial<ReturnType<typeof useShowUpsellBannerModule.default>>) => {
    const mockedUseShowUpsellBanner = vi.mocked(useShowUpsellBannerModule.default);

    mockedUseShowUpsellBanner.mockReturnValue({
        canDisplayUpsellBanner: false,
        needToShowUpsellBanner: { current: false },
        handleDismissBanner: vi.fn(),
        ...value,
    });

    return mockedUseShowUpsellBanner;
};
